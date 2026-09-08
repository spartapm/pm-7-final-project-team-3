export type ToastKind = "ok" | "err" | "info";

export type Category =
  | "ott"
  | "music"
  | "ai"
  | "shopping"
  | "delivery"
  | "membership"
  | "productivity"
  | "design"
  | "cloud"
  | "other";

export type BillingCycle = "monthly" | "yearly" | "weekly";
export type SubStatus = "active" | "trial" | "paused" | "ended";
export type AddKind = "subscription" | "event";
export type CalendarFilter = "all" | "sub" | "life";
export type BenefitKind = "carrier" | "commerce" | "card";

export type Subscription = {
  id: string;
  name: string;
  plan: string;
  category: Category;
  amount: number;
  cycle: BillingCycle;
  payDay: number;
  nextPay: string;
  status: SubStatus;
  autoRenew: boolean;
  unused: boolean;
  memo: string;
  color: string;
  logo: string;
  trialEnds: string | null;
  paused: boolean;
  alertDays: number;
  createdAt: number;
};

export type LifeEvent = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  memo: string;
  createdAt: number;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  href: string;
  icon: "pay" | "warn" | "gift" | "trial" | "price";
  brand?: string;
};

export type Benefit = {
  id: string;
  kind: BenefitKind;
  provider: string;
  providerColor: string;
  title: string;
  body: string;
  href: string;
  icon: string;
  expires?: string;
};

export type DraftSub = {
  name: string;
  plan: string;
  category: Category;
  amount: string;
  cycle: BillingCycle;
  payDay: string;
  nextPay: string;
  autoRenew: boolean;
  memo: string;
  status: SubStatus;
  trialEnds: string;
  alertDays: number;
  fromAi: boolean;
};

export type AlertPrefs = {
  pay: boolean;
  renew: boolean;
  trial: boolean;
  benefit: boolean;
  marketing: boolean;
};

export type AppState = {
  accountId: string;
  email: string;
  loggedIn: boolean;
  loginAt: number | null;
  onboarded: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
  subscriptions: Subscription[];
  events: LifeEvent[];
  notices: Notice[];
  alerts: AlertPrefs;
  seeded: boolean;
};

export const DEMO_EMAIL = "demo@email.com";
export const DEMO_PASSWORD = "Demo1234!@";
