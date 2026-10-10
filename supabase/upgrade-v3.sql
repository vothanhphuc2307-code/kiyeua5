-- NƠI LƯU GIỮ THANH XUÂN A5 — V3 safe additive migration
-- Run ONCE in the existing A5 Supabase project before deploying V3 frontend.
-- This migration adds columns/tables/policies/triggers only. It does not drop existing tables or rows.

begin;

-- V2 profile theme field: IF NOT EXISTS also covers the earlier manual fix.
alter table public.profiles
  add column if not exists profile_color text not null default '#f6dce5';

-- Group memories by event/album using an optional label on each media post.
alter table public.media_items
  add column if not exists album_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'media_items_album_name_length_check'
      and conrelid = 'public.media_items'::regclass
  ) then
    alter table public.media_items
      add constraint media_items_album_name_length_check
      check (album_name is null or char_length(album_name) <= 60);
  end if;
end $$;
create index if not exists media_items_album_name_idx on public.media_items (album_name, created_at desc);

-- In-app notifications created by database triggers for comments and reactions.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid references public.media_items(id) on delete cascade,
  notification_type text not null check (notification_type in ('comment', 'reaction')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
alter table public.notifications enable row level security;
drop policy if exists "Members read own notifications" on public.notifications;
create policy "Members read own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Members mark own notifications read" on public.notifications;
create policy "Members mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "Members delete own notifications" on public.notifications;
create policy "Members delete own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, update, delete on public.notifications to authenticated;

-- Reports can only be submitted for another member's content.
-- Ordinary members can read only reports they submitted; moderation happens through the project owner.
create table if not exists public.media_reports (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references public.media_items(id) on delete set null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('bullying', 'privacy', 'inappropriate', 'spam', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists media_reports_status_created_idx on public.media_reports (status, created_at desc);
create index if not exists media_reports_reporter_idx on public.media_reports (reporter_id, created_at desc);
alter table public.media_reports enable row level security;
drop policy if exists "Members submit reports on other media" on public.media_reports;
create policy "Members submit reports on other media"
  on public.media_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.media_items m
      where m.id = media_id and m.user_id <> (select auth.uid())
    )
  );
drop policy if exists "Members read their submitted reports" on public.media_reports;
create policy "Members read their submitted reports"
  on public.media_reports for select to authenticated
  using (reporter_id = (select auth.uid()));
grant select, insert on public.media_reports to authenticated;

-- SECURITY DEFINER trigger functions use a fixed search_path and create notifications only for the post owner.
create or replace function public.a5_notify_comment_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.media_items where id = new.media_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, media_id, notification_type, created_at)
    select v_owner, new.user_id, new.media_id, 'comment', now()
    where exists (select 1 from public.profiles p where p.id = new.user_id);
  end if;
  return new;
end;
$$;
drop trigger if exists media_comments_notify_owner on public.media_comments;
create trigger media_comments_notify_owner
after insert on public.media_comments
for each row execute function public.a5_notify_comment_owner();

create or replace function public.a5_notify_reaction_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.media_items where id = new.media_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, media_id, notification_type, created_at)
    select v_owner, new.user_id, new.media_id, 'reaction', now()
    where exists (select 1 from public.profiles p where p.id = new.user_id);
  end if;
  return new;
end;
$$;
drop trigger if exists reactions_notify_owner on public.reactions;
create trigger reactions_notify_owner
after insert on public.reactions
for each row execute function public.a5_notify_reaction_owner();

-- Ask PostgREST to refresh its view of the newly added V3 schema.
notify pgrst, 'reload schema';
commit;
