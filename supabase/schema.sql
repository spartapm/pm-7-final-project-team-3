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
  icon text not null default '',
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

-- 1:1 문의 (CS)
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


-- 9차 카테고리/일정
-- 9차: 서비스/혜택 카테고리 + 일정 알림 분

create table if not exists public.catalog_category (
  category_id bigint generated always as identity primary key,
  kind text not null check (kind in ('service', 'benefit')),
  name text not null,
  sort_order int not null default 0,
  app_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

create table if not exists public.product_category (
  product_id bigint not null references public.product(product_id) on delete cascade,
  category_id bigint not null references public.catalog_category(category_id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.bundle_category (
  bundle_id bigint not null references public.bundle_product(bundle_id) on delete cascade,
  category_id bigint not null references public.catalog_category(category_id) on delete cascade,
  primary key (bundle_id, category_id)
);

alter table public.catalog_category enable row level security;
alter table public.product_category enable row level security;
alter table public.bundle_category enable row level security;

drop policy if exists "catalog_category open" on public.catalog_category;
create policy "catalog_category open" on public.catalog_category for all using (true) with check (true);
drop policy if exists "product_category open" on public.product_category;
create policy "product_category open" on public.product_category for all using (true) with check (true);
drop policy if exists "bundle_category open" on public.bundle_category;
create policy "bundle_category open" on public.bundle_category for all using (true) with check (true);

grant all on public.catalog_category to anon, authenticated, service_role;
grant all on public.product_category to anon, authenticated, service_role;
grant all on public.bundle_category to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

insert into public.catalog_category (kind, name, sort_order, app_visible)
values
  ('service', 'OTT·영상', 0, true),
  ('service', '음악·오디오', 1, true),
  ('service', '생성형 AI', 2, true),
  ('service', '디자인·콘텐츠 제작', 3, true),
  ('service', '업무·생산성', 4, true),
  ('service', '콘텐츠·웹툰·전자책', 5, true),
  ('service', '교육·학습', 6, true),
  ('service', '쇼핑·멤버십', 7, true),
  ('service', '배달·생활', 8, true),
  ('service', '게임', 9, true),
  ('service', 'SNS·커뮤니케이션', 10, true),
  ('service', '스포츠·운동', 11, true),
  ('service', '자동차·모빌리티', 12, true),
  ('service', '클라우드·보안', 13, true),
  ('service', '기타', 14, true),
  ('benefit', '통신사 결합', 0, true),
  ('benefit', '일상·생활', 1, true),
  ('benefit', '엔터', 2, true),
  ('benefit', '생성형 AI', 3, true),
  ('benefit', '일·학습', 4, true),
  ('benefit', '카드 혜택', 5, true)
on conflict (kind, name) do nothing;

insert into public.product_category (product_id, category_id)
select p.product_id, c.category_id
from public.product p
join public.catalog_category c on c.kind = 'service' and c.name = case
  when p.category in ('OTT', 'OTT·영상') then 'OTT·영상'
  when p.category in ('음악', '음악·오디오') then '음악·오디오'
  when p.category in ('생성형 AI', 'AI') then '생성형 AI'
  when p.category like '%디자인%' then '디자인·콘텐츠 제작'
  when p.category like '%생산%' or p.category like '%업무%' then '업무·생산성'
  when p.category like '%웹툰%' or p.category like '%전자책%' then '콘텐츠·웹툰·전자책'
  when p.category like '%교육%' or p.category like '%학습%' then '교육·학습'
  when p.category like '%쇼핑%' or p.category like '%멤버십%' then '쇼핑·멤버십'
  when p.category like '%배달%' then '배달·생활'
  when p.category = '게임' then '게임'
  when p.category like '%SNS%' then 'SNS·커뮤니케이션'
  when p.category like '%스포츠%' then '스포츠·운동'
  when p.category like '%모빌%' then '자동차·모빌리티'
  when p.category like '%클라우드%' then '클라우드·보안'
  when p.category in ('기타', '') then '기타'
  else null
end
on conflict do nothing;

insert into public.product_category (product_id, category_id)
select p.product_id, c.category_id
from public.product p
join public.catalog_category c on c.kind = 'benefit' and c.name = case
  when p.category like '%통신%' then '통신사 결합'
  when p.category like '%카드%' then '카드 혜택'
  when p.category like '%커머스%' or p.category like '%멤버십%' then '일상·생활'
  else null
end
on conflict do nothing;

insert into public.bundle_category (bundle_id, category_id)
select b.bundle_id, c.category_id
from public.bundle_product b
join public.catalog_category c on c.kind = 'benefit' and c.name = case
  when b.category like '%통신%' then '통신사 결합'
  when b.category like '%카드%' then '카드 혜택'
  when b.category like '%커머스%' or b.category like '%멤버십%' then '일상·생활'
  when b.category like '%엔터%' or b.category like '%OTT%' then '엔터'
  when b.category like '%AI%' then '생성형 AI'
  when b.category like '%학습%' or b.category like '%생산%' then '일·학습'
  else '일상·생활'
end
on conflict do nothing;

-- 이미 일상·생활로 들어간 OTT/생산성 패키지를 새 혜택 칩에 맞게 재분류
delete from public.bundle_category bc
using public.bundle_product b, public.catalog_category c
where bc.bundle_id = b.bundle_id
  and bc.category_id = c.category_id
  and c.kind = 'benefit'
  and (
    b.category like '%OTT%'
    or b.category like '%생산%'
  );

insert into public.bundle_category (bundle_id, category_id)
select b.bundle_id, c.category_id
from public.bundle_product b
join public.catalog_category c on c.kind = 'benefit' and c.name = case
  when b.category like '%OTT%' then '엔터'
  when b.category like '%생산%' then '일·학습'
  else '일상·생활'
end
where b.category like '%OTT%' or b.category like '%생산%'
on conflict do nothing;

alter table public.events add column if not exists alert_min int not null default 30;
alter table public.events add column if not exists end_date date;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-icons',
  'catalog-icons',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog icons read" on storage.objects;
create policy "catalog icons read"
on storage.objects for select
using (bucket_id = 'catalog-icons');

drop policy if exists "catalog icons insert" on storage.objects;
create policy "catalog icons insert"
on storage.objects for insert
with check (bucket_id = 'catalog-icons');

drop policy if exists "catalog icons update" on storage.objects;
create policy "catalog icons update"
on storage.objects for update
using (bucket_id = 'catalog-icons')
with check (bucket_id = 'catalog-icons');
