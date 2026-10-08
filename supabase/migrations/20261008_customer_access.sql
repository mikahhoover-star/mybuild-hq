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
create policy "Read own project" on public.project_data for select to authenticated using (user_id = (select auth.uid()));
create policy "Insert own project" on public.project_data for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Update own project" on public.project_data for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own project" on public.project_data for delete to authenticated using (user_id = (select auth.uid()));

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
create policy "Read own entitlement" on public.purchase_entitlements for select to authenticated using (user_id = (select auth.uid()));
-- No client insert/update/delete policy: service role only.
