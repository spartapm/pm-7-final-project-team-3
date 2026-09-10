-- 틈 TEUM: 계정 / 구독 / 일정 / 알림

create table if not exists public.accounts (
  id text primary key,
  email text not null unique,
  password text not null,
  onboarded boolean not null default false,
  marketing boolean not null default false,
  alerts jsonb not null default '{}'::jsonb,
  login_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  name text not null,
  plan text not null default '',
  category text not null,
  amount numeric not null,
  cycle text not null,
  pay_day int not null,
  next_pay date not null,
  status text not null,
  auto_renew boolean not null default true,
  unused boolean not null default false,
  memo text not null default '',
  color text not null default '#2576f2',
  logo text not null default '',
  trial_ends date,
  paused boolean not null default false,
  alert_days int not null default 3,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_account_id_idx on public.subscriptions (account_id);

create table if not exists public.events (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  title text not null,
  date date not null,
  start_time text not null default '',
  end_time text not null default '',
  all_day boolean not null default false,
  memo text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists events_account_id_idx on public.events (account_id);

create table if not exists public.notices (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  title text not null,
  body text not null,
  at timestamptz not null default now(),
  read boolean not null default false,
  href text not null default '/home',
  icon text not null default 'pay',
  brand text
);

create index if not exists notices_account_id_idx on public.notices (account_id);

alter table public.accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.events enable row level security;
alter table public.notices enable row level security;

drop policy if exists "accounts open" on public.accounts;
create policy "accounts open" on public.accounts for all using (true) with check (true);
drop policy if exists "subscriptions open" on public.subscriptions;
create policy "subscriptions open" on public.subscriptions for all using (true) with check (true);
drop policy if exists "events open" on public.events;
create policy "events open" on public.events for all using (true) with check (true);
drop policy if exists "notices open" on public.notices;
create policy "notices open" on public.notices for all using (true) with check (true);

grant all on public.accounts to anon, authenticated, service_role;
grant all on public.subscriptions to anon, authenticated, service_role;
grant all on public.events to anon, authenticated, service_role;
grant all on public.notices to anon, authenticated, service_role;

insert into public.accounts (id, email, password, onboarded)
values ('acc_demo', 'demo@email.com', 'Demo1234!@', true)
on conflict (email) do nothing;

alter table public.subscriptions
  add column if not exists every_months int,
  add column if not exists service_id text,
  add column if not exists bundle_id text,
  add column if not exists subscription_type text not null default 'single';

create table if not exists public.services (
  id text primary key,
  name text not null,
  category text not null,
  amount numeric,
  color text not null default '#2576f2',
  logo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.service_keywords (
  id text primary key,
  service_id text not null references public.services(id) on delete cascade,
  keyword text not null
);

create table if not exists public.bundles (
  id text primary key,
  name text not null,
  amount numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.bundle_items (
  id text primary key,
  bundle_id text not null references public.bundles(id) on delete cascade,
  service_id text references public.services(id) on delete set null,
  name text not null default ''
);

create table if not exists public.email_verifications (
  id text primary key,
  email text not null,
  code text not null,
  purpose text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.terms (
  id text primary key,
  kind text not null,
  title text not null,
  body text not null,
  version text not null default '1'
);

create table if not exists public.terms_agreements (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  terms_id text not null references public.terms(id) on delete cascade,
  agreed_at timestamptz not null default now()
);

create table if not exists public.account_deletions (
  id text primary key,
  email text not null,
  reason text not null,
  detail text not null default '',
  deleted_at timestamptz not null default now()
);

create table if not exists public.benefits (
  id text primary key,
  kind text not null,
  provider text not null,
  title text not null,
  body text not null,
  href text not null default '',
  expires date
);

create table if not exists public.benefit_activity (
  id text primary key,
  account_id text references public.accounts(id) on delete cascade,
  benefit_id text references public.benefits(id) on delete cascade,
  action text not null,
  at timestamptz not null default now()
);

create table if not exists public.ai_inspections (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ocr_uploads (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  kind text not null,
  item_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.voice_recognitions (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  kind text not null,
  transcript text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_search_logs (
  id text primary key,
  account_id text references public.accounts(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  account_id text primary key references public.accounts(id) on delete cascade,
  step text not null default 'alerts',
  updated_at timestamptz not null default now()
);
