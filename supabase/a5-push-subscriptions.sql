-- A5 Web Push subscriptions (additive migration; does not delete or alter existing A5 data).
create table if not exists public.a5_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint a5_push_subscriptions_user_endpoint_unique unique (user_id, endpoint)
);

create index if not exists a5_push_subscriptions_user_idx
  on public.a5_push_subscriptions (user_id);

-- Track push delivery idempotently when the V3 in-app notification table already exists.
-- This block is additive and never deletes existing notification rows.
do $$
begin
  if to_regclass('public.notifications') is not null then
    alter table public.notifications add column if not exists push_sent_at timestamptz;
    create index if not exists notifications_pending_push_idx
      on public.notifications (created_at) where push_sent_at is null;
  end if;
end $$;

alter table public.a5_push_subscriptions enable row level security;

drop policy if exists "A5 members read their own push subscriptions" on public.a5_push_subscriptions;
create policy "A5 members read their own push subscriptions"
  on public.a5_push_subscriptions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "A5 members add their own push subscriptions" on public.a5_push_subscriptions;
create policy "A5 members add their own push subscriptions"
  on public.a5_push_subscriptions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "A5 members update their own push subscriptions" on public.a5_push_subscriptions;
create policy "A5 members update their own push subscriptions"
  on public.a5_push_subscriptions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "A5 members remove their own push subscriptions" on public.a5_push_subscriptions;
create policy "A5 members remove their own push subscriptions"
  on public.a5_push_subscriptions for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.a5_push_subscriptions to authenticated;
