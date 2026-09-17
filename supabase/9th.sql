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
