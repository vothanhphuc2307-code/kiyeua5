-- NƠI LƯU GIỮ THANH XUÂN A5
-- Run once in Supabase Dashboard → SQL Editor.
-- Storage files stay in private buckets. Do not put service_role keys in the frontend.

create extension if not exists pgcrypto;

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Bạn A5' check (char_length(display_name) between 1 and 40),
  nickname text not null default '' check (char_length(nickname) <= 32),
  bio text not null default '' check (char_length(bio) <= 180),
  profile_color text not null default '#f6dce5' check (profile_color ~ '^#[0-9a-fA-F]{6}$'),
  avatar_path text,
  linked_providers text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_a5_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_label text;
  provider_name text;
begin
  display_label := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Bạn A5'
  );
  provider_name := coalesce(new.raw_app_meta_data ->> 'provider', '');
  insert into public.profiles (id, display_name, linked_providers)
  values (
    new.id,
    left(display_label, 40),
    case when provider_name in ('google', 'facebook') then array[provider_name]::text[] else '{}'::text[] end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_a5_profile on auth.users;
create trigger on_auth_user_created_a5_profile
after insert on auth.users
for each row execute function public.handle_new_a5_profile();

-- ── Photo/video entries ─────────────────────────────────────────────────────
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 500),
  note_color text not null default '#b64f73' check (note_color ~ '^#[0-9a-fA-F]{6}$'),
  note_font text not null default 'Nunito' check (note_font in ('Nunito', 'Patrick Hand', 'Playfair Display', 'DM Sans')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_items_created_at_idx on public.media_items (created_at desc);
create index if not exists media_items_user_id_idx on public.media_items (user_id, created_at desc);

drop trigger if exists media_items_set_updated_at on public.media_items;
create trigger media_items_set_updated_at
before update on public.media_items
for each row execute function public.set_updated_at();

-- ── Reactions ───────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('🩷', '❤️', '😂', '😭', '🥹', '😍', '✨', '🫶', '🔥', '🤡', '👍', '💯')),
  created_at timestamptz not null default now(),
  constraint reactions_one_per_user_emoji unique (media_id, user_id, emoji)
);

create index if not exists reactions_media_id_idx on public.reactions (media_id, created_at desc);
create index if not exists reactions_user_id_idx on public.reactions (user_id);

-- ── Comments on memories ────────────────────────────────────────────────────
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
drop trigger if exists media_comments_set_updated_at on public.media_comments;
create trigger media_comments_set_updated_at
before update on public.media_comments
for each row execute function public.set_updated_at();

-- ── Row Level Security: ownership is enforced by PostgreSQL, not only UI ────
alter table public.profiles enable row level security;
alter table public.media_items enable row level security;
alter table public.reactions enable row level security;
alter table public.media_comments enable row level security;

drop policy if exists "A5 members can read profiles" on public.profiles;
create policy "A5 members can read profiles"
on public.profiles for select to authenticated
using (true);

drop policy if exists "Members can create their own profile" on public.profiles;
create policy "Members can create their own profile"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "A5 members can read memory entries" on public.media_items;
create policy "A5 members can read memory entries"
on public.media_items for select to authenticated
using (true);

drop policy if exists "Members can create their own memory entries" on public.media_items;
create policy "Members can create their own memory entries"
on public.media_items for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Only owners can edit memory entries" on public.media_items;
create policy "Only owners can edit memory entries"
on public.media_items for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Only owners can delete memory entries" on public.media_items;
create policy "Only owners can delete memory entries"
on public.media_items for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "A5 members can see reactions" on public.reactions;
create policy "A5 members can see reactions"
on public.reactions for select to authenticated
using (true);

drop policy if exists "Members can react as themselves" on public.reactions;
create policy "Members can react as themselves"
on public.reactions for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Members can remove their own reactions" on public.reactions;
create policy "Members can remove their own reactions"
on public.reactions for delete to authenticated
using (user_id = (select auth.uid()));

-- Members may read comments on memories visible to the A5 group.
drop policy if exists "A5 members can read comments" on public.media_comments;
create policy "A5 members can read comments"
on public.media_comments for select to authenticated
using (true);

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

-- SQL-created tables need explicit grants; RLS policies still filter all rows/actions.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.media_items to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert, update, delete on public.media_comments to authenticated;

-- ── Private Storage buckets ─────────────────────────────────────────────────
-- The app signs read links for authenticated users. Objects live under <auth.uid()>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-media', 'memory-media', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/quicktime','video/webm','video/x-m4v']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Memory bucket: all authenticated A5 members may view memories; owners can mutate their own files.
drop policy if exists "A5 members can read memory objects" on storage.objects;
create policy "A5 members can read memory objects"
on storage.objects for select to authenticated
using (bucket_id = 'memory-media');

drop policy if exists "Members upload files to their own memory folder" on storage.objects;
create policy "Members upload files to their own memory folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'memory-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Only owners can update their memory files" on storage.objects;
create policy "Only owners can update their memory files"
on storage.objects for update to authenticated
using (bucket_id = 'memory-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'memory-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Only owners can delete their memory files" on storage.objects;
create policy "Only owners can delete their memory files"
on storage.objects for delete to authenticated
using (bucket_id = 'memory-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Avatar bucket: readable by authenticated A5 members; write/delete within own UID folder only.
drop policy if exists "A5 members can read avatar objects" on storage.objects;
create policy "A5 members can read avatar objects"
on storage.objects for select to authenticated
using (bucket_id = 'profile-avatars');

drop policy if exists "Members upload their own avatars" on storage.objects;
create policy "Members upload their own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Only owners can update their avatar objects" on storage.objects;
create policy "Only owners can update their avatar objects"
on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Only owners can delete their avatar objects" on storage.objects;
create policy "Only owners can delete their avatar objects"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Reminder: do not create public buckets and do not expose the service_role key to a browser.
