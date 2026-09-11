export type BundleProvider = {
  id: string;
  name: string;
};

export type BundleProduct = {
  id: string;
  providerId: string;
  name: string;
  included: string;
  amount: number;
  everyMonths: number;
};

export const BUNDLE_PROVIDERS: BundleProvider[] = [
  { id: "yudok", name: "유독" },
  { id: "kt", name: "KT" },
  { id: "lgu", name: "LG U+" },
  { id: "naver", name: "네이버플러스 멤버십" },
  { id: "coupang", name: "쿠팡 와우" },
  { id: "skt", name: "SKT" },
  { id: "etc", name: "기타" },
];

export const BUNDLE_PRODUCTS: BundleProduct[] = [
  { id: "yudok-nf-yt", providerId: "yudok", name: "넷플릭스 + 유튜브 프리미엄", included: "넷플릭스, 유튜브 프리미엄", amount: 18900, everyMonths: 1 },
  { id: "yudok-yt-emo", providerId: "yudok", name: "유튜브 프리미엄 + 카카오톡 이모티콘 플러스", included: "유튜브 프리미엄, 카카오톡 이모티콘 플러스", amount: 14900, everyMonths: 1 },
  { id: "yudok-yt-ai", providerId: "yudok", name: "유튜브 프리미엄 + Google AI Pro", included: "유튜브 프리미엄, Google AI Pro", amount: 29000, everyMonths: 1 },
  { id: "yudok-disney", providerId: "yudok", name: "디즈니+ + 추가 혜택", included: "디즈니+", amount: 9900, everyMonths: 1 },
  { id: "yudok-yt-snow", providerId: "yudok", name: "유튜브 프리미엄 + SNOW", included: "유튜브 프리미엄, SNOW", amount: 0, everyMonths: 1 },
  { id: "kt-yogo69-ott", providerId: "kt", name: "요고 69 · OTT 2개", included: "티빙 / 디즈니+ / 유튜브 프리미엄 중 2개", amount: 69000, everyMonths: 1 },
  { id: "kt-yogo69-book", providerId: "kt", name: "요고 69 · 지니/밀리 1개", included: "지니뮤직 / 밀리의서재 중 1개", amount: 69000, everyMonths: 1 },
  { id: "kt-yogo61-ott", providerId: "kt", name: "요고 61 · OTT 1개", included: "티빙 / 디즈니+ / 유튜브 프리미엄 중 1개", amount: 61000, everyMonths: 1 },
  { id: "kt-yogo61-book", providerId: "kt", name: "요고 61 · 지니/밀리 1개", included: "지니뮤직 / 밀리의서재 중 1개", amount: 61000, everyMonths: 1 },
  { id: "kt-yogo55-tving", providerId: "kt", name: "요고 55 · 티빙 광고형 스탠다드", included: "티빙", amount: 55000, everyMonths: 1 },
  { id: "kt-yogo55-book", providerId: "kt", name: "요고 55 · 지니/밀리 1개", included: "지니뮤직 / 밀리의서재 중 1개", amount: 55000, everyMonths: 1 },
  { id: "kt-tving-pack", providerId: "kt", name: "티빙 생활구독팩", included: "티빙, 카카오톡 이모티콘 플러스 / SNOW", amount: 11500, everyMonths: 1 },
  { id: "lgu-nf-yt", providerId: "lgu", name: "넷플릭스 + 유튜브 프리미엄", included: "넷플릭스, 유튜브 프리미엄", amount: 18900, everyMonths: 1 },
  { id: "lgu-disney", providerId: "lgu", name: "디즈니+ 결합", included: "디즈니+", amount: 9900, everyMonths: 1 },
  { id: "naver-nf", providerId: "naver", name: "넷플릭스 광고형 스탠다드", included: "넷플릭스 광고형 스탠다드", amount: 4900, everyMonths: 1 },
  { id: "naver-sp", providerId: "naver", name: "스포티파이 프리미엄 베이직", included: "스포티파이 프리미엄 베이직", amount: 4900, everyMonths: 1 },
  { id: "naver-xbox", providerId: "naver", name: "PC Game Pass", included: "PC Game Pass", amount: 4900, everyMonths: 1 },
  { id: "naver-snow", providerId: "naver", name: "스튜던트 · SNOW", included: "SNOW", amount: 4900, everyMonths: 1 },
  { id: "naver-cake", providerId: "naver", name: "스튜던트 · Cake", included: "Cake", amount: 4900, everyMonths: 1 },
  { id: "coupang-play", providerId: "coupang", name: "쿠팡플레이", included: "쿠팡플레이", amount: 7890, everyMonths: 1 },
  { id: "baemin-yt", providerId: "etc", name: "배민클럽 · 유튜브 프리미엄", included: "유튜브 프리미엄", amount: 13990, everyMonths: 1 },
  { id: "skt-yt-ott", providerId: "skt", name: "T 우주 · 유튜브 + OTT 1개", included: "유튜브 프리미엄 + 넷플릭스 / 디즈니+ / 티빙 / 웨이브 중 1개", amount: 1000, everyMonths: 1 },
  { id: "skt-nf-ott", providerId: "skt", name: "T 우주 · 넷플릭스 + OTT 1개", included: "넷플릭스 + 유튜브 프리미엄 / 디즈니+ / 티빙 / 웨이브 중 1개", amount: 1000, everyMonths: 1 },
  { id: "skt-ds-ott", providerId: "skt", name: "T 우주 · 디즈니+ + OTT 1개", included: "디즈니+ + 유튜브 프리미엄 / 넷플릭스 / 티빙 / 웨이브 중 1개", amount: 1000, everyMonths: 1 },
  { id: "etc-tving-wavve", providerId: "etc", name: "티빙 + 웨이브", included: "티빙, 웨이브", amount: 13500, everyMonths: 1 },
  { id: "etc-tving-disney", providerId: "etc", name: "티빙 + 디즈니+", included: "티빙, 디즈니+", amount: 18000, everyMonths: 1 },
  { id: "etc-apple-one", providerId: "etc", name: "Apple One 개인", included: "Apple Music, Apple TV+, Apple Arcade, iCloud+", amount: 14900, everyMonths: 1 },
];

export function productsOf(providerId: string) {
  return BUNDLE_PRODUCTS.filter((p) => p.providerId === providerId);
}

export function findBundle(id: string) {
  return BUNDLE_PRODUCTS.find((p) => p.id === id);
}

export function providerName(id: string) {
  return BUNDLE_PROVIDERS.find((p) => p.id === id)?.name ?? id;
}
