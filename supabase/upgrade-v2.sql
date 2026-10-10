-- NƠI LƯU GIỮ THANH XUÂN A5 — upgrade v2
-- Run once in the EXISTING Supabase project via SQL Editor.
-- Safe/idempotent for this feature update: it adds a profile color, allows extra emoji reactions,
-- and creates the comments table/policies. It does not delete existing media or profiles.

alter table public.profiles
  add column if not exists profile_color text not null default '#f6dce5';

-- Ensure profile theme colors remain valid six-digit hex values.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_profile_color_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_profile_color_check
      check (profile_color ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

-- Replace the earlier five-emoji check with the expanded reaction set.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'reactions_emoji_check'
      and conrelid = 'public.reactions'::regclass
  ) then
    alter table public.reactions drop constraint reactions_emoji_check;
  end if;
  alter table public.reactions add constraint reactions_emoji_check
    check (emoji in ('🩷', '❤️', '😂', '😭', '🥹', '😍', '✨', '🫶', '🔥', '🤡', '👍', '💯'));
end $$;

create table if not exists public.media_comments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_comments_media_id_idx on public.media_comments (media_id, created_at asc);
create index if not exists media_comments_user_id_idx on public.media_comments (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists media_comments_set_updated_at on public.media_comments;
create trigger media_comments_set_updated_at
before update on public.media_comments for each row execute function public.set_updated_at();

alter table public.media_comments enable row level security;

drop policy if exists "A5 members can read comments" on public.media_comments;
create policy "A5 members can read comments"
on public.media_comments for select to authenticated using (true);

drop policy if exists "Members can add comments as themselves" on public.media_comments;
create policy "Members can add comments as themselves"
on public.media_comments for insert to authenticated
with check (user_id = (select auth.uid()) and exists (select 1 from public.media_items m where m.id = media_id));

drop policy if exists "Authors can edit their own comments" on public.media_comments;
create policy "Authors can edit their own comments"
on public.media_comments for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Authors or memory owners can delete comments" on public.media_comments;
create policy "Authors or memory owners can delete comments"
on public.media_comments for delete to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.media_items m where m.id = media_id and m.user_id = (select auth.uid())
));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.media_comments to authenticated;
