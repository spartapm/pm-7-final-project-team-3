import type { AlertPrefs, Benefit, Category, DraftSub, LifeEvent, Notice, Subscription } from "./types";
import { daysUntil, nextPayDate } from "./format";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "ott", label: "OTT·영상" },
  { id: "music", label: "음악·오디오" },
  { id: "ai", label: "업무·생산성" },
  { id: "shopping", label: "쇼핑·멤버십" },
  { id: "delivery", label: "배달·생활" },
  { id: "membership", label: "쇼핑·멤버십" },
  { id: "productivity", label: "업무·생산성" },
  { id: "design", label: "디자인·콘텐츠 제작" },
  { id: "cloud", label: "클라우드·보안" },
  { id: "other", label: "기타" },
];

export const CATEGORY_OPTIONS = CATEGORIES.filter((c, i, a) => a.findIndex((x) => x.label === c.label) === i);

export function categorySelectOptions(current?: Category) {
  if (current && !CATEGORY_OPTIONS.some((c) => c.id === current)) {
    const hit = CATEGORIES.find((c) => c.id === current);
    if (hit) return [...CATEGORY_OPTIONS, hit];
  }
  return CATEGORY_OPTIONS;
}

export const SERVICES: { name: string; category: Category; amount: number; color: string; logo: string }[] = [
  { name: "Netflix", category: "ott", amount: 17000, color: "#E50914", logo: "N" },
  { name: "YouTube Premium", category: "ott", amount: 14900, color: "#FF0000", logo: "▶" },
  { name: "Disney+", category: "ott", amount: 9900, color: "#113CCF", logo: "D+" },
  { name: "티빙", category: "ott", amount: 9500, color: "#FF153C", logo: "t" },
  { name: "ChatGPT", category: "ai", amount: 29000, color: "#10A37F", logo: "G" },
  { name: "Spotify", category: "music", amount: 10900, color: "#1ED760", logo: "♪" },
  { name: "멜론", category: "music", amount: 10900, color: "#00CD3C", logo: "M" },
  { name: "네이버플러스", category: "membership", amount: 4900, color: "#03C75A", logo: "N" },
  { name: "쿠팡와우", category: "shopping", amount: 7890, color: "#E47422", logo: "C" },
  { name: "배민클럽", category: "delivery", amount: 4990, color: "#2AC1BC", logo: "배" },
  { name: "Canva Pro", category: "design", amount: 15000, color: "#7C6FEF", logo: "C" },
  { name: "iCloud+", category: "cloud", amount: 3300, color: "#3693F3", logo: "☁" },
];

export const BENEFITS: Benefit[] = [
  {
    id: "skt-netflix",
    kind: "carrier",
    provider: "SKT",
    providerColor: "#E31837",
    title: "결합하면 넷플릭스 공짜",
    body: "T 멤버십 결합 시 넷플릭스 스탠다드가 포함돼요.",
    href: "https://www.tworld.co.kr",
    icon: "🎬",
  },
  {
    id: "kt-pick",
    kind: "carrier",
    provider: "KT",
    providerColor: "#E8630A",
    title: "티빙 · 지니 · 밀리 하나 골라 무료",
    body: "KT 결합 요금제에서 OTT·음원·전자책 중 하나를 선택하세요.",
    href: "https://product.kt.com",
    icon: "🎧",
    expires: "2026-09-20",
  },
  {
    id: "lgu-disney",
    kind: "carrier",
    provider: "LG U+",
    providerColor: "#E6007E",
    title: "디즈니+ 결합하고 매달 5,000원 할인",
    body: "유독 결합 시 디즈니+ 월 이용료가 할인돼요.",
    href: "https://www.lguplus.com",
    icon: "🏰",
  },
  {
    id: "coupang-wow",
    kind: "commerce",
    provider: "쿠팡",
    providerColor: "#A16207",
    title: "로켓배송+쿠팡플레이 7,890원",
    body: "와우 멤버십 하나로 배송과 영상을 같이 쓸 수 있어요.",
    href: "https://www.coupang.com",
    icon: "📦",
  },
  {
    id: "naver-spotify",
    kind: "commerce",
    provider: "NAVER",
    providerColor: "#03C75A",
    title: "네이버 혜택 그대로 스포티파이까지",
    body: "네이버플러스 멤버십에 스포티파이 이용권이 포함돼요.",
    href: "https://nid.naver.com",
    icon: "🎵",
  },
  {
    id: "card-ott",
    kind: "card",
    provider: "카드",
    providerColor: "#2F7DEB",
    title: "월 자동결제 · 네이버페이 포인트 적립",
    body: "구독 자동결제 시 포인트가 쌓이는 카드를 확인해 보세요.",
    href: "https://card-search.naver.com",
    icon: "💳",
    expires: "2026-09-30",
  },
];

export const PROMOS = [
  {
    kicker: "NEW",
    title: "친구 초대하고\n커피 쿠폰 받으세요!",
    sub: "친구 초대 시 스타벅스 아메리카노 쿠폰 증정",
  },
  {
    kicker: "TIP",
    title: "결제 전에 한 번만\n확인하면 새는 돈을 잠가요",
    sub: "다가오는 결제·갱신을 홈에서 먼저 살펴보세요",
  },
  {
    kicker: "AI",
    title: "결제 내역 사진만 올리면\n구독이 알아서 채워져요",
    sub: "AI 후보는 확인한 뒤에만 목록에 반영됩니다",
  },
  {
    kicker: "혜택",
    title: "통신사 결합에 이미\n들어 있는 OTT가 있어요",
    sub: "중복 결제 중인 구독을 혜택 탭에서 점검하세요",
  },
  {
    kicker: "캘린더",
    title: "구독 일정과 약속을\n한 달 보기에서 같이 봐요",
    sub: "필터로 구독·일상·전체를 나눠 볼 수 있어요",
  },
  {
    kicker: "알림",
    title: "무료체험이 끝나기 전에\n미리 알려 드릴게요",
    sub: "마이페이지에서 결제·갱신·체험 알림을 켜세요",
  },
];

export function emptyDraft(kind: "subscription" | "event" = "subscription"): DraftSub {
  const today = new Date();
  return {
    name: "",
    plan: "",
    category: "ott",
    amount: "",
    cycle: "monthly",
    payDay: String(today.getDate()),
    nextPay: nextPayDate(today.getDate()),
    autoRenew: true,
    memo: "",
    status: "active",
    trialEnds: "",
    alertDays: 3,
    fromAi: false,
  };
}

export function seedSubscriptions(): Subscription[] {
  const netflixDay = 27;
  const gptDay = 29;
  const ytDay = 15;
  const spDay = 5;
  const nvDay = 10;
  const cvDay = 30;
  return [
    {
      id: "sub_netflix",
      name: "Netflix",
      plan: "스탠다드",
      category: "ott",
      amount: 17000,
      cycle: "monthly",
      payDay: netflixDay,
      nextPay: nextPayDate(netflixDay),
      status: "active",
      autoRenew: true,
      unused: true,
      memo: "",
      color: "#E50914",
      logo: "N",
      trialEnds: null,
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 40,
    },
    {
      id: "sub_gpt",
      name: "ChatGPT",
      plan: "Plus",
      category: "ai",
      amount: 29000,
      cycle: "monthly",
      payDay: gptDay,
      nextPay: nextPayDate(gptDay),
      status: "active",
      autoRenew: true,
      unused: false,
      memo: "",
      color: "#10A37F",
      logo: "G",
      trialEnds: null,
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: "sub_youtube",
      name: "YouTube Premium",
      plan: "개인",
      category: "ott",
      amount: 14900,
      cycle: "monthly",
      payDay: ytDay,
      nextPay: nextPayDate(ytDay),
      status: "active",
      autoRenew: true,
      unused: false,
      memo: "",
      color: "#FF0000",
      logo: "▶",
      trialEnds: null,
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 60,
    },
    {
      id: "sub_spotify",
      name: "Spotify",
      plan: "Premium",
      category: "music",
      amount: 10900,
      cycle: "monthly",
      payDay: spDay,
      nextPay: nextPayDate(spDay),
      status: "active",
      autoRenew: true,
      unused: true,
      memo: "네이버플러스에 포함될 수 있어요",
      color: "#1ED760",
      logo: "♪",
      trialEnds: null,
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 90,
    },
    {
      id: "sub_naver",
      name: "네이버플러스",
      plan: "멤버십",
      category: "membership",
      amount: 4900,
      cycle: "monthly",
      payDay: nvDay,
      nextPay: nextPayDate(nvDay),
      status: "active",
      autoRenew: true,
      unused: false,
      memo: "",
      color: "#03C75A",
      logo: "N",
      trialEnds: null,
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 12,
    },
    {
      id: "sub_canva",
      name: "Canva Pro",
      plan: "Pro",
      category: "design",
      amount: 15000,
      cycle: "monthly",
      payDay: cvDay,
      nextPay: nextPayDate(cvDay),
      status: "trial",
      autoRenew: true,
      unused: false,
      memo: "",
      color: "#7C6FEF",
      logo: "C",
      trialEnds: nextPayDate(cvDay),
      paused: false,
      alertDays: 3,
      createdAt: Date.now() - 86400000 * 8,
    },
  ];
}

export function seedEvents(): LifeEvent[] {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const today = `${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return [
    {
      id: "evt_dinner",
      title: "저녁 약속",
      date: today,
      start: "19:00",
      end: "21:00",
      allDay: false,
      memo: "",
      createdAt: Date.now(),
    },
  ];
}

export function seedNotices(subs: Subscription[]): Notice[] {
  const gpt = subs.find((s) => s.name === "ChatGPT");
  const now = Date.now();
  return [
    {
      id: "nt_price_gpt",
      title: "ChatGPT 가격변동 예정",
      body: `${gpt ? gpt.nextPay.slice(5).replace("-", "월 ") + "일" : "갱신일"}에 ${gpt?.amount.toLocaleString("ko-KR")}원으로 갱신돼요.`,
      at: now - 10800000,
      read: false,
      href: gpt ? `/subscriptions/${gpt.id}` : "/home",
      icon: "price",
      brand: "ChatGPT",
    },
    {
      id: "nt_leak",
      title: "새는 구독 2개 발견",
      body: "사용하지 않는 구독을 정리하면 최대 17,900원을 아낄 수 있어요.",
      at: now - 86400000,
      read: false,
      href: "/inspect",
      icon: "warn",
    },
    {
      id: "nt_invite",
      title: "친구 초대 쿠폰 증정",
      body: "스타벅스 아메리카노 쿠폰을 받을 수 있어요",
      at: now - 86400000 * 2,
      read: false,
      href: "/home?invite=1",
      icon: "gift",
    },
  ];
}

export function benefitStatus(b: Benefit, subs: Subscription[]): "owned" | "expiring" | "available" {
  if (b.expires) {
    const left = daysUntil(b.expires);
    if (left >= 0 && left <= 30) return "expiring";
  }
  const names = subs.filter((s) => s.status !== "ended").map((s) => s.name);
  if (names.some((n) => b.title.includes(n) || b.body.includes(n))) return "owned";
  return "available";
}

export function isBundleLike(sub: Subscription) {
  if (["네이버플러스", "쿠팡와우", "배민클럽"].includes(sub.name)) return true;
  if (/결합|포함될 수 있/.test(`${sub.plan} ${sub.memo}`)) return true;
  return BENEFITS.some((b) => b.title.includes(sub.name) || b.body.includes(sub.name));
}

function payLabel(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export function mergePayNotices(subs: Subscription[], alerts: AlertPrefs, existing: Notice[]): Notice[] {
  const generated: Notice[] = [];
  for (const s of subs) {
    if (s.status === "ended" || s.paused) continue;
    const days = daysUntil(s.nextPay);
    if (alerts.trial && s.status === "trial" && s.trialEnds) {
      const td = daysUntil(s.trialEnds);
      if (td >= 0 && td <= s.alertDays) {
        generated.push({
          id: `trial_${s.id}_${s.trialEnds}`,
          title: `${s.name} 무료체험 종료 예정`,
          body: `${payLabel(s.trialEnds)} 무료체험이 끝나고 유료로 전환돼요.`,
          at: Date.now() - Math.max(0, s.alertDays - td) * 3600000,
          read: false,
          href: `/subscriptions/${s.id}`,
          icon: "trial",
          brand: s.name,
        });
      }
    }
    if (alerts.pay && days >= 0 && days <= s.alertDays && s.status !== "trial") {
      generated.push({
        id: `pay_${s.id}_${s.nextPay}`,
        title: `${s.name} 자동결제 예정`,
        body: `${payLabel(s.nextPay)}에 ${s.amount.toLocaleString("ko-KR")}원이 결제될 예정이에요.`,
        at: Date.now() - Math.max(0, s.alertDays - days) * 3600000,
        read: false,
        href: `/subscriptions/${s.id}`,
        icon: "pay",
        brand: s.name,
      });
    } else if (alerts.renew && s.autoRenew && days >= 0 && days <= s.alertDays && s.status !== "trial") {
      generated.push({
        id: `renew_${s.id}_${s.nextPay}`,
        title: `${s.name} 자동 갱신 예정`,
        body: `${payLabel(s.nextPay)}에 구독이 자동으로 갱신돼요.`,
        at: Date.now() - Math.max(0, s.alertDays - days) * 1800000,
        read: false,
        href: `/subscriptions/${s.id}`,
        icon: "price",
        brand: s.name,
      });
    }
  }
  const prev = new Map(existing.map((n) => [n.id, n]));
  const mergedGen = generated.map((n) => {
    const old = prev.get(n.id);
    return old ? { ...n, read: old.read, at: old.at } : n;
  });
  const kept = existing.filter((n) => !n.id.startsWith("pay_") && !n.id.startsWith("trial_") && !n.id.startsWith("renew_"));
  return [...mergedGen, ...kept].sort((a, b) => b.at - a.at);
}

export const TERMS = `틈(TEUM) 서비스 이용약관

제1조 (목적)
이 약관은 틈이 제공하는 구독 관리 서비스의 이용 조건과 절차를 정합니다.

제2조 (서비스의 내용)
틈은 사용자가 직접 등록한 구독·일정·혜택 정보를 한곳에서 확인하고, 결제·갱신 전에 관리할 수 있도록 돕습니다. AI가 제안한 정보는 사용자가 확인하기 전까지 확정되지 않습니다.

제3조 (회원의 의무)
회원은 정확한 정보를 입력해야 하며, 타인의 결제 정보나 계좌·카드 번호를 수기 입력해서는 안 됩니다.

제4조 (면책)
틈은 외부 서비스의 실제 해지·결제·요금제 변경을 대행하지 않습니다. 공식 서비스에서 직접 처리해야 합니다.`;

export const PRIVACY = `개인정보처리방침

틈은 이메일 계정, 구독·일정 기록, 알림 설정을 서비스 제공 목적으로만 보관합니다. 마이데이터 기반 금융 연동은 MVP 범위에 포함되지 않습니다.

회원 탈퇴 시 계정과 등록 데이터는 즉시 삭제됩니다.`;
