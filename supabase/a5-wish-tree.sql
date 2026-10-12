-- A5 Wish Tree: additive migration only.
-- Creates a separate shared table; does not alter or delete existing A5 memories.
create table if not exists public.a5_wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wish_text text not null check (char_length(btrim(wish_text)) between 1 and 240),
  created_at timestamptz not null default now()
);

create index if not exists a5_wishes_created_at_idx
  on public.a5_wishes (created_at desc, id desc);

alter table public.a5_wishes enable row level security;

-- A5 members who have signed in can read shared wishes.
drop policy if exists a5_wishes_select_authenticated on public.a5_wishes;
create policy a5_wishes_select_authenticated
  on public.a5_wishes for select to authenticated
  using (true);

-- Members may add wishes only under their own auth identity.
drop policy if exists a5_wishes_insert_own on public.a5_wishes;
create policy a5_wishes_insert_own
  on public.a5_wishes for insert to authenticated
  with check (auth.uid() = user_id);

-- Members may remove only their own wish if they need to correct it.
drop policy if exists a5_wishes_delete_own on public.a5_wishes;
create policy a5_wishes_delete_own
  on public.a5_wishes for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.a5_wishes to authenticated;

-- Add the new table to Realtime when Supabase Realtime is enabled.
-- If Realtime publication is absent, the feature still works via ordinary reads.
do $a5_wish_realtime$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'a5_wishes'
     ) then
    execute 'alter publication supabase_realtime add table public.a5_wishes';
  end if;
end
$a5_wish_realtime$;

-- Verify table and RLS state. This query is read-only.
select c.relname as table_name, c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'a5_wishes';
