-- A5 V3.4 — profile dreams + shared classroom seating
-- Safe migration for an existing A5 database. Does not delete or rewrite existing posts, reactions, comments, users, or Storage files.
-- Run once in Supabase Dashboard → SQL Editor while connected to the existing A5 project.

begin;

-- 1) Add public, optional profile fields. Existing profiles receive empty strings.
alter table public.profiles
  add column if not exists dream_job text not null default '' check (char_length(dream_job) <= 100),
  add column if not exists hobbies text not null default '' check (char_length(hobbies) <= 160),
  add column if not exists future_wishes text not null default '' check (char_length(future_wishes) <= 200);

-- 2) Create one row per seat: 2 rows/dãy × 7 desks × 4 seats = 56 seats.
-- The current class has 45 students, leaving 11 spare seats for flexibility.
create table if not exists public.classroom_seats (
  seat_code text primary key,
  row_code text not null check (row_code in ('A', 'B')),
  desk_number integer not null check (desk_number between 1 and 7),
  seat_number integer not null check (seat_number between 1 and 4),
  user_id uuid unique references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  constraint classroom_seats_position_unique unique (row_code, desk_number, seat_number)
);

create index if not exists classroom_seats_user_id_idx on public.classroom_seats(user_id);
create index if not exists classroom_seats_layout_idx on public.classroom_seats(row_code, desk_number, seat_number);

insert into public.classroom_seats (seat_code, row_code, desk_number, seat_number)
select row_code || '-' || lpad(desk_number::text, 2, '0') || '-' || seat_number::text,
       row_code, desk_number, seat_number
from (values ('A'::text), ('B'::text)) as rows(row_code)
cross join generate_series(1, 7) as desks(desk_number)
cross join generate_series(1, 4) as seats(seat_number)
on conflict (seat_code) do nothing;

alter table public.classroom_seats enable row level security;

drop policy if exists "A5 members can view classroom seats" on public.classroom_seats;
create policy "A5 members can view classroom seats"
  on public.classroom_seats for select to authenticated
  using (true);

-- The browser can read the seat map but cannot directly insert, update, or delete assignments.
grant select on public.classroom_seats to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.classroom_seats from anon, authenticated;

-- 3) Server-side seat reservation. A transaction protects against two people claiming the same seat.
-- Users can only claim an empty seat or their own current seat, and each account can own one seat.
create or replace function public.choose_classroom_seat(p_seat_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'Please sign in before choosing a seat.' using errcode = '28000';
  end if;

  -- Serialize seat changes from the same account.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_uid::text)::bigint);

  select cs.user_id into v_existing
  from public.classroom_seats as cs
  where cs.seat_code = p_seat_code
  for update;

  if not found then
    raise exception 'Seat not found.' using errcode = '22023';
  end if;

  if v_existing is not null and v_existing <> v_uid then
    raise exception 'This seat has already been chosen.' using errcode = '23505';
  end if;

  update public.classroom_seats
     set user_id = null, assigned_at = null
   where user_id = v_uid and seat_code <> p_seat_code;

  update public.classroom_seats
     set user_id = v_uid, assigned_at = now()
   where seat_code = p_seat_code;

  return pg_catalog.jsonb_build_object('seat_code', p_seat_code);
end;
$$;

revoke all on function public.choose_classroom_seat(text) from public;
revoke all on function public.choose_classroom_seat(text) from anon;
grant execute on function public.choose_classroom_seat(text) to authenticated;

commit;

-- Only refresh the PostgREST schema cache; no content rows are removed.
notify pgrst, 'reload schema';
