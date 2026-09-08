"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

const SQL = `create table if not exists public.accounts (
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
on conflict (email) do nothing;`;

export function CloudBanner() {
  const { cloudStatus, retryPull } = useStore();
  const [copied, setCopied] = useState(false);
  if (cloudStatus !== "missing-table") return null;
  return (
    <div className="cloud-banner">
      <div className="cloud-banner-title">Supabase 테이블이 아직 없습니다</div>
      <div className="cloud-banner-body">
        <a href="https://supabase.com/dashboard/project/gauyomvdwdqnxyfxdqkb/sql/new" target="_blank" rel="noreferrer">
          SQL Editor 열기
        </a>
        에 스키마를 붙여넣고 Run 하면 기기 간에 구독·일정이 동기화됩니다.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(SQL).catch(() => undefined);
            setCopied(true);
          }}
        >
          {copied ? "복사됨" : "SQL 복사"}
        </button>
        <button type="button" onClick={() => retryPull()}>다시 시도</button>
      </div>
    </div>
  );
}
