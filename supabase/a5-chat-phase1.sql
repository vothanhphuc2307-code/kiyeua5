-- A5 Messenger Phase 1
-- Adds chat-only tables and functions. It does not alter or delete existing media/yearbook/wish-tree data.
-- Run once in Supabase SQL Editor after keeping a backup of the project.

begin;

create table if not exists public.a5_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('group', 'direct')),
  title text,
  created_by uuid references auth.users(id) on delete set null,
  member_one_id uuid references auth.users(id) on delete cascade,
  member_two_id uuid references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint a5_chat_group_has_no_pair check (kind <> 'group' or (member_one_id is null and member_two_id is null)),
  constraint a5_chat_direct_has_pair check (kind <> 'direct' or (member_one_id is not null and member_two_id is not null and member_one_id <> member_two_id and member_one_id < member_two_id))
);

create unique index if not exists a5_chat_direct_pair_unique
  on public.a5_chat_conversations (member_one_id, member_two_id)
  where kind = 'direct';

create table if not exists public.a5_chat_members (
  conversation_id uuid not null references public.a5_chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists a5_chat_members_user_idx on public.a5_chat_members (user_id, joined_at desc);

create table if not exists public.a5_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.a5_chat_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists a5_chat_messages_conversation_created_idx
  on public.a5_chat_messages (conversation_id, created_at desc, id desc);

create table if not exists public.a5_chat_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  is_online boolean not null default false,
  show_presence boolean not null default true,
  updated_at timestamptz not null default now()
);

-- One fixed group room shared by the class. No existing table is changed.
insert into public.a5_chat_conversations (id, kind, title)
values ('a5000000-0000-4000-8000-000000000001'::uuid, 'group', 'Phòng chat 12A5')
on conflict (id) do update set kind = excluded.kind, title = excluded.title;

-- Ensure the helper used by RLS checks only whether the signed-in user belongs to a conversation.
create or replace function public.a5_chat_is_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.a5_chat_members m
    where m.conversation_id = p_conversation_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.a5_chat_is_member(uuid) from public, anon;
grant execute on function public.a5_chat_is_member(uuid) to authenticated;

-- Add existing A5 profiles to the class room. ON CONFLICT preserves existing membership/read state.
insert into public.a5_chat_members (conversation_id, user_id)
select 'a5000000-0000-4000-8000-000000000001'::uuid, p.id
from public.profiles p
on conflict (conversation_id, user_id) do nothing;

-- Automatically add newly created profiles to the class room.
create or replace function public.a5_chat_auto_join_class_room()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.a5_chat_members (conversation_id, user_id)
  values ('a5000000-0000-4000-8000-000000000001'::uuid, new.id)
  on conflict (conversation_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists a5_chat_after_profile_insert on public.profiles;
create trigger a5_chat_after_profile_insert
after insert on public.profiles
for each row execute function public.a5_chat_auto_join_class_room();
revoke all on function public.a5_chat_auto_join_class_room() from public, anon, authenticated;

-- Called by authenticated clients to repair/join only their own class-room membership.
create or replace function public.a5_chat_join_class_room()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid := 'a5000000-0000-4000-8000-000000000001'::uuid;
begin
  if v_user_id is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id) then
    raise exception 'A5 profile is not ready yet.' using errcode = '23503';
  end if;
  insert into public.a5_chat_members (conversation_id, user_id)
  values (v_room_id, v_user_id)
  on conflict (conversation_id, user_id) do nothing;
  return v_room_id;
end;
$$;
revoke all on function public.a5_chat_join_class_room() from public, anon;
grant execute on function public.a5_chat_join_class_room() to authenticated;

-- Create or return the one direct conversation for these two users.
create or replace function public.a5_chat_get_or_create_direct(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_one uuid;
  v_two uuid;
  v_conversation_id uuid;
begin
  if v_me is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  if p_other_user_id is null or p_other_user_id = v_me then
    raise exception 'Choose another A5 member.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_me) then
    raise exception 'Your A5 profile is not ready.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_other_user_id) then
    raise exception 'That A5 member was not found.' using errcode = '23503';
  end if;

  if v_me < p_other_user_id then v_one := v_me; v_two := p_other_user_id;
  else v_one := p_other_user_id; v_two := v_me; end if;

  select c.id into v_conversation_id
  from public.a5_chat_conversations c
  where c.kind = 'direct' and c.member_one_id = v_one and c.member_two_id = v_two
  limit 1;

  if v_conversation_id is null then
    insert into public.a5_chat_conversations (kind, created_by, member_one_id, member_two_id)
    values ('direct', v_me, v_one, v_two)
    on conflict (member_one_id, member_two_id) where kind = 'direct' do nothing
    returning id into v_conversation_id;
    if v_conversation_id is null then
      select c.id into v_conversation_id
      from public.a5_chat_conversations c
      where c.kind = 'direct' and c.member_one_id = v_one and c.member_two_id = v_two
      limit 1;
    end if;
  end if;

  insert into public.a5_chat_members (conversation_id, user_id)
  values (v_conversation_id, v_one), (v_conversation_id, v_two)
  on conflict (conversation_id, user_id) do nothing;
  return v_conversation_id;
end;
$$;
revoke all on function public.a5_chat_get_or_create_direct(uuid) from public, anon;
grant execute on function public.a5_chat_get_or_create_direct(uuid) to authenticated;

-- Mark a conversation read without giving clients broad write access to the membership table.
create or replace function public.a5_chat_mark_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  update public.a5_chat_members
    set last_read_at = now()
    where conversation_id = p_conversation_id and user_id = auth.uid();
end;
$$;
revoke all on function public.a5_chat_mark_read(uuid) from public, anon;
grant execute on function public.a5_chat_mark_read(uuid) to authenticated;

-- Keep conversation previews in sync when a member sends a message.
create or replace function public.a5_chat_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.a5_chat_conversations
    set last_message_at = new.created_at,
        last_message_preview = left(regexp_replace(new.body, '[[:space:]]+', ' ', 'g'), 120),
        last_message_sender_id = new.sender_id
    where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists a5_chat_after_message_insert on public.a5_chat_messages;
create trigger a5_chat_after_message_insert
after insert on public.a5_chat_messages
for each row execute function public.a5_chat_touch_conversation();
revoke all on function public.a5_chat_touch_conversation() from public, anon, authenticated;

-- Access control: chat records are private to members of each conversation.
alter table public.a5_chat_conversations enable row level security;
alter table public.a5_chat_members enable row level security;
alter table public.a5_chat_messages enable row level security;
alter table public.a5_chat_presence enable row level security;

drop policy if exists a5_chat_conversations_select_members on public.a5_chat_conversations;
create policy a5_chat_conversations_select_members on public.a5_chat_conversations
  for select to authenticated using (public.a5_chat_is_member(id));

drop policy if exists a5_chat_members_select_conversation_members on public.a5_chat_members;
create policy a5_chat_members_select_conversation_members on public.a5_chat_members
  for select to authenticated using (public.a5_chat_is_member(conversation_id));

drop policy if exists a5_chat_messages_select_members on public.a5_chat_messages;
create policy a5_chat_messages_select_members on public.a5_chat_messages
  for select to authenticated using (public.a5_chat_is_member(conversation_id));

drop policy if exists a5_chat_messages_insert_members on public.a5_chat_messages;
create policy a5_chat_messages_insert_members on public.a5_chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and char_length(btrim(body)) between 1 and 4000
    and public.a5_chat_is_member(conversation_id)
  );

drop policy if exists a5_chat_presence_select_visible on public.a5_chat_presence;
create policy a5_chat_presence_select_visible on public.a5_chat_presence
  for select to authenticated using (
    user_id = auth.uid()
    or (
      show_presence = true
      and exists (
        select 1
        from public.a5_chat_members mine
        join public.a5_chat_members theirs
          on theirs.conversation_id = mine.conversation_id
        where mine.user_id = auth.uid()
          and theirs.user_id = a5_chat_presence.user_id
      )
    )
  );

drop policy if exists a5_chat_presence_insert_self on public.a5_chat_presence;
create policy a5_chat_presence_insert_self on public.a5_chat_presence
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists a5_chat_presence_update_self on public.a5_chat_presence;
create policy a5_chat_presence_update_self on public.a5_chat_presence
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.a5_chat_conversations from anon, authenticated, public;
revoke all on public.a5_chat_members from anon, authenticated, public;
revoke all on public.a5_chat_messages from anon, authenticated, public;
revoke all on public.a5_chat_presence from anon, authenticated, public;
grant select on public.a5_chat_conversations to authenticated;
grant select on public.a5_chat_members to authenticated;
grant select, insert on public.a5_chat_messages to authenticated;
grant select, insert, update on public.a5_chat_presence to authenticated;

-- Enable database-change events for chat if the project's publication is available.
do $$
declare
  v_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['a5_chat_conversations','a5_chat_members','a5_chat_messages','a5_chat_presence'] loop
      if to_regclass('public.' || v_table) is not null
        and not exists (
          select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
        ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;

commit;

-- Verification: all four tables should exist; row counts are intentionally omitted here.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('a5_chat_conversations','a5_chat_members','a5_chat_messages','a5_chat_presence')
order by table_name;
