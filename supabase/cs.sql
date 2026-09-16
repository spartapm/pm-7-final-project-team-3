-- 1:1 문의 (CS). 웹 전용: OS 푸시 없이 notices 테이블로 앱 내 알림.
create table if not exists public.inquiry (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'WAITING',
  answer_body text not null default '',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  closed_at timestamptz,
  read_at timestamptz
);

create index if not exists inquiry_account_id_idx on public.inquiry (account_id);
create index if not exists inquiry_status_idx on public.inquiry (status);
create index if not exists inquiry_created_at_idx on public.inquiry (created_at desc);

alter table public.inquiry enable row level security;
drop policy if exists "inquiry open" on public.inquiry;
create policy "inquiry open" on public.inquiry for all using (true) with check (true);
