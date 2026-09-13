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

-- 한상균 PM 카탈로그 (제공사 / 단독상품 / 결합 / 구성 / 할인이벤트)
-- 사용자 구독·일정·알림은 기존 accounts / subscriptions / events / notices 유지

create table if not exists public.provider (
  provider_id bigint generated always as identity primary key,
  provider_name text not null unique,
  provider_type text not null default '',
  logo_url text not null default '',
  official_url text not null default '',
  brand_color text not null default '#2576f2',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product (
  product_id bigint generated always as identity primary key,
  provider_id bigint references public.provider(provider_id) on delete set null,
  product_name text not null,
  category text not null default '',
  product_type text not null default '단독',
  price_standard int not null default 0,
  official_url text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bundle_product (
  bundle_id bigint generated always as identity primary key,
  bundle_name text not null,
  category text not null default '',
  card_title text not null default '',
  card_body text not null default '',
  icon text not null default '',
  price_bundled int not null default 0,
  apply_method text not null default '',
  requirement text not null default '',
  official_url text not null default '',
  expires date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bundle_item (
  bundle_id bigint not null references public.bundle_product(bundle_id) on delete cascade,
  product_id bigint not null references public.product(product_id) on delete cascade,
  item_role text not null default 'PRIMARY',
  required boolean not null default true,
  primary key (bundle_id, product_id)
);

create table if not exists public.product_promotion (
  promotion_id bigint generated always as identity primary key,
  product_id bigint references public.product(product_id) on delete cascade,
  promotion_name text not null,
  price_discount int,
  discount_amount int,
  apply_method text not null default '',
  requirement text not null default '',
  start_at date,
  end_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider enable row level security;
alter table public.product enable row level security;
alter table public.bundle_product enable row level security;
alter table public.bundle_item enable row level security;
alter table public.product_promotion enable row level security;

drop policy if exists "provider open" on public.provider;
create policy "provider open" on public.provider for all using (true) with check (true);
drop policy if exists "product open" on public.product;
create policy "product open" on public.product for all using (true) with check (true);
drop policy if exists "bundle_product open" on public.bundle_product;
create policy "bundle_product open" on public.bundle_product for all using (true) with check (true);
drop policy if exists "bundle_item open" on public.bundle_item;
create policy "bundle_item open" on public.bundle_item for all using (true) with check (true);
drop policy if exists "product_promotion open" on public.product_promotion;
create policy "product_promotion open" on public.product_promotion for all using (true) with check (true);

grant all on public.provider to anon, authenticated, service_role;
grant all on public.product to anon, authenticated, service_role;
grant all on public.bundle_product to anon, authenticated, service_role;
grant all on public.bundle_item to anon, authenticated, service_role;
grant all on public.product_promotion to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

create unique index if not exists product_provider_name_idx on public.product (provider_id, product_name);
create unique index if not exists bundle_product_name_idx on public.bundle_product (bundle_name);

insert into public.provider (provider_name, provider_type, official_url, brand_color)
values
  ('SKT', '통신사', 'https://www.tworld.co.kr', '#E31837'),
  ('KT', '통신사', 'https://product.kt.com', '#E8630A'),
  ('LG U+', '통신사', 'https://www.lguplus.com', '#E6007E'),
  ('쿠팡', '커머스', 'https://www.coupang.com', '#A16207'),
  ('Naver', '커머스', 'https://nid.naver.com', '#03C75A'),
  ('Netflix', 'OTT', 'https://www.netflix.com', '#E50914'),
  ('티빙', 'OTT', 'https://www.tving.com', '#FF153C'),
  ('디즈니+', 'OTT', 'https://www.disneyplus.com', '#113CCF'),
  ('Spotify', '음악', 'https://www.spotify.com', '#1ED760')
on conflict (provider_name) do update set
  provider_type = excluded.provider_type,
  official_url = excluded.official_url,
  brand_color = excluded.brand_color,
  updated_at = now();

insert into public.product (provider_id, product_name, category, product_type, price_standard, official_url)
select p.provider_id, v.product_name, v.category, '단독', v.price, v.url
from (values
  ('SKT', 'SKT T 멤버십', '통신사 결합', 0, 'https://www.tworld.co.kr'),
  ('Netflix', '넷플릭스 Standard', 'OTT', 13500, 'https://www.netflix.com'),
  ('Netflix', '넷플릭스 광고형 Standard', 'OTT', 7000, 'https://www.netflix.com'),
  ('KT', 'KT 결합 요금제', '통신사 결합', 0, 'https://product.kt.com'),
  ('티빙', '티빙', 'OTT', 10900, 'https://www.tving.com'),
  ('LG U+', '유독 요금제', '통신사 결합', 0, 'https://www.lguplus.com'),
  ('디즈니+', '디즈니+ 스탠다드', 'OTT', 9900, 'https://www.disneyplus.com'),
  ('쿠팡', '쿠팡 와우', '커머스 멤버십', 7890, 'https://www.coupang.com'),
  ('쿠팡', '쿠팡플레이', 'OTT', 0, 'https://www.coupang.com'),
  ('Naver', '네이버플러스 멤버십', '커머스 멤버십', 4900, 'https://nid.naver.com'),
  ('Spotify', 'Spotify Premium', '음악', 8690, 'https://www.spotify.com')
) as v(provider_name, product_name, category, price, url)
join public.provider p on p.provider_name = v.provider_name
on conflict (provider_id, product_name) do update set
  category = excluded.category,
  price_standard = excluded.price_standard,
  official_url = excluded.official_url,
  updated_at = now();

insert into public.bundle_product (bundle_name, category, card_title, card_body, icon, price_bundled, apply_method, requirement, official_url, is_active)
values
  ('SKT & Netflix 결합상품', '통신사 결합', '결합하면 넷플릭스 공짜', 'SKT 우주패스 결합 혜택', '🎬', 0,
   E'1. T 월드에서 T 우주/결합 혜택을 확인하세요.\n2. 넷플릭스 포함 상품을 신청하세요.\n3. 틈 구독 목록에 결합상품으로 등록하세요.',
   E'- 실제 제공 여부와 요금은 SKT 결합 정책에 따릅니다.\n- 틈은 신청·해지를 대행하지 않아요.',
   'https://www.tworld.co.kr/web/home', true),
  ('KT & Tving 결합상품', '통신사 결합', '티빙·지니·밀리 하나 골라 무료', 'KT 요고 요금제 결합 시', '🎧', 0,
   E'1. KT 결합 요금제에서 혜택을 고르세요.\n2. 선택한 서비스를 활성화하세요.\n3. 틈에 결합상품으로 등록하세요.',
   E'- 선택 혜택은 월 1회 변경될 수 있습니다.\n- 실제 조건은 KT 정책에 따릅니다.',
   'https://product.kt.com', true),
  ('유독 & 디즈니+ 결합상품', '통신사 결합', '디즈니+ 결합하고 매달 5,000원 할인', 'LG U+ 유독 구독 결합', '🏰', 4900,
   E'1. 유플러스 유독에서 디즈니+ 결합을 확인하세요.\n2. 결합 신청 후 디즈니+를 활성화하세요.\n3. 틈 구독 목록에 결합상품으로 등록하세요.',
   E'- 할인 금액과 대상 요금제는 LG U+ 안내에 따릅니다.\n- 틈은 해지나 요금제 변경을 대행하지 않아요.',
   'https://www.lguplus.com/pogg/product/ytp-26-pick-life', true),
  ('쿠팡 멤버십', '커머스 멤버십', '로켓배송+쿠팡플레이 7,890원', '쿠팡 와우 멤버십 하나로', '📦', 7890,
   E'1. 쿠팡 앱에서 와우 멤버십을 가입하세요.\n2. 쿠팡플레이를 활성화하세요.\n3. 틈에 쿠팡와우를 등록하세요.',
   '- 로켓배송·쿠팡플레이 제공 범위는 쿠팡 멤버십 약관에 따릅니다.',
   'https://www.coupang.com/np/campaigns/83', true),
  ('네이버멤버십 & Spotify 결합상품', '커머스 멤버십', '네이버 혜택 그대로 스포티파이까지', '네이버플러스 멤버십 결합', '🎵', 4900,
   E'1. 네이버플러스 멤버십을 확인하세요.\n2. 스포티파이 이용권을 활성화하세요.\n3. 틈에 결합상품으로 등록하세요.',
   '- 포함여부와 이용기간은 네이버플러스 혜택 안내에 따릅니다.',
   'https://nid.naver.com/membership/my?m=viewBenefit', true)
on conflict (bundle_name) do update set
  category = excluded.category,
  card_title = excluded.card_title,
  card_body = excluded.card_body,
  icon = excluded.icon,
  price_bundled = excluded.price_bundled,
  apply_method = excluded.apply_method,
  requirement = excluded.requirement,
  official_url = excluded.official_url,
  updated_at = now();

insert into public.bundle_item (bundle_id, product_id, item_role, required)
select b.bundle_id, p.product_id, v.role, true
from (values
  ('SKT & Netflix 결합상품', 'SKT T 멤버십', 'PRIMARY'),
  ('SKT & Netflix 결합상품', '넷플릭스 Standard', 'BENEFIT'),
  ('KT & Tving 결합상품', 'KT 결합 요금제', 'PRIMARY'),
  ('KT & Tving 결합상품', '티빙', 'BENEFIT'),
  ('유독 & 디즈니+ 결합상품', '유독 요금제', 'PRIMARY'),
  ('유독 & 디즈니+ 결합상품', '디즈니+ 스탠다드', 'BENEFIT'),
  ('쿠팡 멤버십', '쿠팡 와우', 'PRIMARY'),
  ('쿠팡 멤버십', '쿠팡플레이', 'BENEFIT'),
  ('네이버멤버십 & Spotify 결합상품', '네이버플러스 멤버십', 'PRIMARY'),
  ('네이버멤버십 & Spotify 결합상품', 'Spotify Premium', 'BENEFIT')
) as v(bundle_name, product_name, role)
join public.bundle_product b on b.bundle_name = v.bundle_name
join public.product p on p.product_name = v.product_name
on conflict (bundle_id, product_id) do update set item_role = excluded.item_role;
