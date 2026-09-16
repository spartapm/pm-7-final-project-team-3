alter table public.product add column if not exists icon text;
alter table public.product add column if not exists product_name_en text not null default '';

create table if not exists public.product_plan (
  plan_id bigint generated always as identity primary key,
  product_id bigint not null references public.product(product_id) on delete cascade,
  plan_name text not null default '',
  price_standard int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_plan enable row level security;
drop policy if exists "product_plan open" on public.product_plan;
create policy "product_plan open" on public.product_plan for all using (true) with check (true);
grant all on public.product_plan to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
