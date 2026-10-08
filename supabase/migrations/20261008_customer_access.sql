-- MyBuild HQ: account-owned project storage and purchase entitlements.
-- Run in Supabase SQL Editor after reviewing.
create table if not exists public.project_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.project_data enable row level security;
revoke all on public.project_data from anon;
grant select, insert, update, delete on public.project_data to authenticated;
-- Only trusted backend/service-role code may write entitlements.
create table if not exists public.purchase_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gumroad_sale_id text unique,
  product_id text not null,
  status text not null check (status in ('active','revoked')),
  verified_at timestamptz not null default now()
);
alter table public.purchase_entitlements enable row level security;
revoke all on public.purchase_entitlements from anon, authenticated;
grant select on public.purchase_entitlements to authenticated;
drop policy if exists "Read own entitlement" on public.purchase_entitlements;
create policy "Read own entitlement" on public.purchase_entitlements for select to authenticated using (user_id = (select auth.uid()));
-- No client insert/update/delete policy: service role only.

-- The browser can only read/write project data with an active paid entitlement.
-- Using the authenticated user's ID prevents cross-account access.
drop policy if exists "Read own paid project" on public.project_data;
create policy "Read own paid project" on public.project_data
for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.purchase_entitlements e
    where e.user_id = (select auth.uid()) and e.status = 'active'
  )
);
drop policy if exists "Insert own paid project" on public.project_data;
create policy "Insert own paid project" on public.project_data
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.purchase_entitlements e
    where e.user_id = (select auth.uid()) and e.status = 'active'
  )
);
drop policy if exists "Update own paid project" on public.project_data;
create policy "Update own paid project" on public.project_data
for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.purchase_entitlements e
    where e.user_id = (select auth.uid()) and e.status = 'active'
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.purchase_entitlements e
    where e.user_id = (select auth.uid()) and e.status = 'active'
  )
);
drop policy if exists "Delete own paid project" on public.project_data;
create policy "Delete own paid project" on public.project_data
for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.purchase_entitlements e
    where e.user_id = (select auth.uid()) and e.status = 'active'
  )
);
