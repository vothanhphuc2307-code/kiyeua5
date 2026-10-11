-- A5 live updates: safely enable Realtime for tables that already exist.
-- This only changes the Realtime publication; it does not update or delete user data.
-- Run once in Supabase SQL Editor after making a backup.

do $a5_realtime$
declare
  table_name text;
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    raise exception 'Publication supabase_realtime was not found. Enable Supabase Realtime for this project before running this migration.';
  end if;

  foreach table_name in array array[
    'media_items',
    'profiles',
    'reactions',
    'media_comments',
    'notifications'
  ] loop
    if to_regclass('public.' || table_name) is not null
       and not exists (
         select 1
         from pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = 'public'
           and tablename = table_name
       ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$a5_realtime$;

-- Verification: this should show the existing public tables enabled for live updates.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('media_items', 'profiles', 'reactions', 'media_comments', 'notifications')
order by tablename;
