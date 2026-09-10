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
  | "webtoon"
  | "edu"
  | "game"
  | "sns"
  | "sports"
  | "mobility"
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
  everyMonths?: number;
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
  payMethod?: string;
  parentId?: string;
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
  alertMin?: number;
  endDate?: string;
};

export type ExtractFrom = "image" | "voice";

export type ExtractSubItem = {
  id: string;
  kind: "subscription";
  name: string;
  plan: string;
  amount: string;
  day: number | null;
  nextPay: string;
  category: Category;
  cycle: BillingCycle;
  payMethod: string;
  memo: string;
  alertDays: number;
  trialDays: string;
  status: SubStatus;
  needConfirm: boolean;
};

export type ExtractEventItem = {
  id: string;
  kind: "event";
  title: string;
  date: string;
  endDate: string;
  start: string;
  end: string;
  allDay: boolean;
  memo: string;
  alertMin: number;
  needConfirm: boolean;
};

export type ExtractItem = ExtractSubItem | ExtractEventItem;

export type ExtractState = {
  kind: AddKind;
  from: ExtractFrom;
  items: ExtractItem[];
  dirty: boolean;
  origin: string;
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
  howTo?: string;
  terms?: string;
};

export type DraftSub = {
  name: string;
  plan: string;
  category: Category;
  amount: string;
  cycle: BillingCycle;
  everyMonths?: number;
  payDay: string;
  nextPay: string;
  autoRenew: boolean;
  memo: string;
  status: SubStatus;
  trialEnds: string;
  alertDays: number;
  fromAi: boolean;
  payMethod: string;
  trialDays: string;
};

export type AlertPrefs = {
  pay: boolean;
  renew: boolean;
  trial: boolean;
  benefit: boolean;
  marketing: boolean;
  calendar: boolean;
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
