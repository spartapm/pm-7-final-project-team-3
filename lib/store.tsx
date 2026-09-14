"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { emptyDraft, mergePayNotices, seedEvents, seedNotices, seedSubscriptions } from "./catalog";
import {
  deleteAccount,
  emailOnCloud,
  findAccountByEmail,
  loginCloud,
  pullAccount,
  pushAccount,
  resetPasswordCloud,
  signupCloud,
  type CloudStatus,
} from "./cloud";
import { daysUntil, ensureFuturePay, nextPayDate, uid } from "./format";
import type {
  AlertPrefs,
  AppState,
  DraftSub,
  LifeEvent,
  Subscription,
  ToastKind,
} from "./types";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./types";

const KEY = "teum:v1";
const USERS_KEY = "teum:users";
const SESSION_FLAG = "teum:session-expired";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

type UserRec = { email: string; password: string };

function defaultAlerts(): AlertPrefs {
  return { pay: true, renew: true, trial: true, benefit: true, marketing: false, calendar: true };
}

function empty(): AppState {
  return {
    accountId: uid("acc"),
    email: "",
    loggedIn: false,
    loginAt: null,
    onboarded: false,
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
    subscriptions: [],
    events: [],
    notices: [],
    alerts: defaultAlerts(),
    seeded: false,
    kakaoId: "",
  };
}

function cleanSub(raw: unknown): Subscription | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Subscription;
  const id = String(s.id ?? "");
  if (!id) return null;
  const cycle = s.cycle === "yearly" || s.cycle === "weekly" ? s.cycle : "monthly";
  const status = s.status === "trial" || s.status === "paused" || s.status === "ended" ? s.status : "active";
  return {
    ...s,
    id,
    name: String(s.name ?? ""),
    plan: String(s.plan ?? ""),
    amount: Number(s.amount) || 0,
    cycle,
    status,
    payDay: Number(s.payDay) || 1,
    nextPay: String(s.nextPay ?? ""),
    autoRenew: Boolean(s.autoRenew),
    unused: Boolean(s.unused),
    memo: String(s.memo ?? ""),
    color: String(s.color ?? "#2576f2"),
    logo: String(s.logo ?? ""),
    trialEnds: s.trialEnds ? String(s.trialEnds) : null,
    paused: Boolean(s.paused) || status === "paused",
    alertDays: Number(s.alertDays) || 0,
    createdAt: Number(s.createdAt) || 0,
  };
}

function cleanEvent(raw: unknown): LifeEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as LifeEvent;
  const id = String(e.id ?? "");
  if (!id) return null;
  return {
    ...e,
    id,
    title: String(e.title ?? ""),
    date: String(e.date ?? ""),
    start: String(e.start ?? ""),
    end: String(e.end ?? ""),
    allDay: Boolean(e.allDay),
    memo: String(e.memo ?? ""),
    createdAt: Number(e.createdAt) || 0,
    endDate: e.endDate ? String(e.endDate) : undefined,
  };
}

function withNotices(s: AppState): AppState {
  const subscriptions = (Array.isArray(s.subscriptions) ? s.subscriptions : [])
    .map(cleanSub)
    .filter((x): x is Subscription => Boolean(x))
    .map((sub) => {
      if (sub.status === "trial" && sub.trialEnds) {
        const nextPay = daysUntil(sub.trialEnds) >= 0
          ? sub.trialEnds
          : ensureFuturePay(sub.trialEnds, sub.payDay, sub.cycle, sub.everyMonths);
        return nextPay === sub.nextPay ? sub : { ...sub, nextPay };
      }
      const nextPay = ensureFuturePay(sub.nextPay, sub.payDay, sub.cycle, sub.everyMonths);
      return nextPay === sub.nextPay ? sub : { ...sub, nextPay };
    });
  const events = (Array.isArray(s.events) ? s.events : [])
    .map(cleanEvent)
    .filter((x): x is LifeEvent => Boolean(x));
  const notices = (Array.isArray(s.notices) ? s.notices : []).filter((n) => n && typeof n === "object" && n.id);
  return { ...s, subscriptions, events, notices: mergePayNotices(subscriptions, s.alerts, notices, events) };
}

function fillDemoGaps(
  remote: { subscriptions: AppState["subscriptions"]; events: AppState["events"]; notices: AppState["notices"] },
  local: Pick<AppState, "subscriptions" | "events" | "notices">,
  demo: boolean,
) {
  const subscriptions = remote.subscriptions.length > 0
    ? remote.subscriptions
    : demo
      ? (local.subscriptions.length ? local.subscriptions : seedSubscriptions())
      : remote.subscriptions;
  const events = remote.events.length > 0
    ? remote.events
    : demo
      ? (local.events.length ? local.events : seedEvents())
      : remote.events;
  const notices = remote.notices.length > 0
    ? remote.notices
    : demo
      ? (local.notices.length ? local.notices : seedNotices(subscriptions))
      : remote.notices;
  return { subscriptions, events, notices };
}

function load(): AppState {
  const fallback = empty();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.loggedIn && parsed.loginAt && Date.now() - parsed.loginAt > SESSION_MS) {
      sessionStorage.setItem(SESSION_FLAG, "1");
      return { ...fallback, accountId: parsed.accountId, email: parsed.email };
    }
    return withNotices({ ...fallback, ...parsed, alerts: { ...defaultAlerts(), ...(parsed.alerts ?? {}) } });
  } catch {
    return fallback;
  }
}

function loadUsers(): UserRec[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const list = raw ? (JSON.parse(raw) as UserRec[]) : [];
    if (!list.some((u) => u.email === DEMO_EMAIL)) {
      list.push({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    }
    return list;
  } catch {
    return [{ email: DEMO_EMAIL, password: DEMO_PASSWORD }];
  }
}

type Toast = { message: string; kind: ToastKind } | null;

type Store = AppState & {
  hydrated: boolean;
  cloudStatus: CloudStatus;
  querying: boolean;
  toast: Toast;
  draft: DraftSub;
  failOnce: boolean;
  users: UserRec[];
  showToast: (message: string, kind?: ToastKind) => void;
  clearToast: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; server?: boolean }>;
  loginSocial: (email: string, extra?: { kakaoId?: string }) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, marketing: boolean) => Promise<{ ok: boolean; error?: string }>;
  emailRegistered: (email: string) => Promise<boolean>;
  resetPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  withdraw: () => Promise<void>;
  setOnboarded: (marketing: boolean) => void;
  setAlerts: (p: Partial<AlertPrefs>) => void;
  upsertSub: (s: Subscription) => void;
  removeSub: (id: string) => void;
  upsertEvent: (e: LifeEvent) => void;
  removeEvent: (id: string) => void;
  markNotice: (id: string) => void;
  markAllNotices: () => void;
  setDraft: (d: Partial<DraftSub>) => void;
  resetDraft: () => void;
  seedDemo: () => void;
  simulateFail: () => boolean;
  retryPull: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("off");
  const [querying, setQuerying] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [draft, setDraftState] = useState<DraftSub>(emptyDraft());
  const [failOnce, setFailOnce] = useState(false);
  const [users, setUsers] = useState<UserRec[]>([]);
  const skipPush = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  const mutGen = useRef(0);
  const touch = () => {
    mutGen.current += 1;
  };

  useEffect(() => {
    const loaded = load();
    setState(loaded);
    setUsers(loadUsers());
    setHydrated(true);
    skipPush.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [hydrated, users]);

  const showToast = useCallback((message: string, kind: ToastKind = "ok") => {
    setToast({ message, kind });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const rememberUser = useCallback((email: string, password: string) => {
    const key = email.trim().toLowerCase();
    setUsers((list) => {
      const i = list.findIndex((u) => String(u.email ?? "").toLowerCase() === key);
      if (i >= 0) {
        const next = list.slice();
        next[i] = { email: list[i].email, password };
        return next;
      }
      return [...list, { email: email.trim(), password }];
    });
  }, []);

  const runPull = useCallback(async (accountId: string) => {
    const genAtPull = mutGen.current;
    setQuerying(true);
    const res = await pullAccount(accountId, stateRef.current.alerts);
    setQuerying(false);
    if (res.status === "off") {
      setCloudStatus("off");
      return;
    }
    setCloudStatus(res.status);
    if (res.status !== "ok" || !res.data) return;
    if (mutGen.current !== genAtPull) return;
    const remote = res.data;
    const demo = stateRef.current.email === DEMO_EMAIL;
    setState((s) => {
      const filled = fillDemoGaps(remote, s, demo);
      const next = {
        ...s,
        onboarded: remote.onboarded || s.onboarded,
        marketingAccepted: remote.marketing || s.marketingAccepted,
        alerts: remote.alerts ?? s.alerts,
        ...filled,
      };
      return withNotices(next);
    });
  }, []);

  const runPush = useCallback(async () => {
    const status = await pushAccount(stateRef.current);
    if (status === "error") {
      setToast({ message: "클라우드 저장에 실패했어요", kind: "err" });
    }
    if (status !== "off") setCloudStatus(status);
    return status;
  }, []);

  useEffect(() => {
    if (!hydrated || !state.loggedIn) return;
    void runPull(state.accountId);
  }, [hydrated, state.loggedIn, state.accountId, runPull]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    if (!state.loggedIn) return;
    const t = setTimeout(() => {
      void runPush();
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, state, runPush]);

  const seedDemo = useCallback(() => {
    touch();
    const subs = seedSubscriptions();
    setState((s) => withNotices({
      ...s,
      subscriptions: subs,
      events: seedEvents(),
      notices: seedNotices(subs),
      seeded: true,
    }));
  }, []);

  const login: Store["login"] = useCallback(async (email, password) => {
    if (failOnce) {
      setFailOnce(false);
      return { ok: false, server: true };
    }
    const trimmed = email.trim().toLowerCase();
    const cloud = await loginCloud(trimmed, password);
    if (cloud.status === "missing-table") setCloudStatus("missing-table");
    else if (cloud.status === "ok") setCloudStatus("ok");
    else if (cloud.status === "error") setCloudStatus("error");
    else setCloudStatus("off");

    const local = users.find((u) => String(u.email ?? "").toLowerCase() === trimmed);
    if (cloud.status === "ok") {
      if (cloud.mismatch) {
        return { ok: false, error: "가입되지 않았거나, 이메일 또는 비밀번호가 일치하지 않습니다." };
      }
    } else if (cloud.status === "error") {
      if (!local || local.password !== password) return { ok: false, server: true };
    } else if (!local || local.password !== password) {
      return { ok: false, error: "가입되지 않았거나, 이메일 또는 비밀번호가 일치하지 않습니다." };
    }

    const demo = trimmed === DEMO_EMAIL;
    const accountId = cloud.account?.id ?? (demo ? "acc_demo" : local ? `acc_${trimmed.replace(/[^a-z0-9]/g, "").slice(0, 12)}` : uid("acc"));
    rememberUser(trimmed, password);
    sessionStorage.removeItem(SESSION_FLAG);
    touch();
    skipPush.current = true;

    let next: AppState = {
      ...stateRef.current,
      accountId,
      email: cloud.account?.email ?? (local?.email ?? trimmed),
      loggedIn: true,
      loginAt: Date.now(),
      onboarded: cloud.account?.onboarded ?? true,
      termsAccepted: true,
      privacyAccepted: true,
    };

    if (cloud.status === "ok" && cloud.account) {
      const pulled = await pullAccount(accountId, next.alerts);
      if (pulled.status === "ok" && pulled.data) {
        const remote = pulled.data;
        const filled = fillDemoGaps(remote, next, demo);
        next = {
          ...next,
          onboarded: remote.onboarded || next.onboarded,
          marketingAccepted: remote.marketing || next.marketingAccepted,
          alerts: remote.alerts ?? next.alerts,
          ...filled,
          seeded: demo || filled.subscriptions.length > 0,
        };
      } else if (demo) {
        const subs = seedSubscriptions();
        next = { ...next, subscriptions: subs, events: seedEvents(), notices: seedNotices(subs), seeded: true };
      }
    } else if (demo) {
      const same = stateRef.current.email === DEMO_EMAIL && stateRef.current.subscriptions.length > 0;
      if (!same) {
        const subs = seedSubscriptions();
        next = { ...next, subscriptions: subs, events: seedEvents(), notices: seedNotices(subs), seeded: true };
      }
    } else if (stateRef.current.email !== trimmed) {
      next = { ...next, subscriptions: [], events: [], notices: [], seeded: false };
    }

    setState(withNotices(next));
    skipPush.current = false;
    void pushAccount(withNotices(next)).then((status) => {
      if (status !== "off") setCloudStatus(status);
    });
    return { ok: true };
  }, [failOnce, rememberUser, users]);

  const signup: Store["signup"] = useCallback(async (email, password, marketing) => {
    const trimmed = email.trim().toLowerCase();
    const localExists = users.some((u) => String(u.email ?? "").toLowerCase() === trimmed);
    if (localExists) return { ok: false, error: "이미 가입된 이메일입니다." };
    const accountId = uid("acc");
    const alerts = { ...defaultAlerts(), marketing };
    const cloud = await signupCloud({ id: accountId, email: trimmed, password, marketing, alerts });
    if (cloud.status === "ok" && cloud.exists) return { ok: false, error: "이미 가입된 이메일입니다." };
    if (cloud.status === "error") {
      setCloudStatus("error");
      return { ok: false, error: "서버가 불안정합니다. 잠시 후 다시 시도해주세요." };
    }
    if (cloud.status === "missing-table") setCloudStatus("missing-table");
    else if (cloud.status === "ok") setCloudStatus("ok");
    rememberUser(trimmed, password);
    sessionStorage.removeItem(SESSION_FLAG);
    touch();
    skipPush.current = true;
    setState(withNotices({
      ...empty(),
      accountId,
      email: trimmed,
      loggedIn: true,
      loginAt: Date.now(),
      onboarded: false,
      termsAccepted: true,
      privacyAccepted: true,
      marketingAccepted: marketing,
      alerts,
    }));
    return { ok: true };
  }, [rememberUser, users]);

  const loginSocial: Store["loginSocial"] = useCallback(async (email, extra) => {
    const trimmed = email.trim().toLowerCase();
    const kakaoId = extra?.kakaoId ?? "";
    const local = users.find((u) => String(u.email ?? "").toLowerCase() === trimmed);
    const found = await findAccountByEmail(trimmed);
    if (found.account) {
      const password = `TeumSoc1!${uid("pw").slice(-6)}`;
      rememberUser(trimmed, password);
      sessionStorage.removeItem(SESSION_FLAG);
      touch();
      skipPush.current = true;
      let next: AppState = {
        ...stateRef.current,
        accountId: found.account.id,
        email: found.account.email || trimmed,
        loggedIn: true,
        loginAt: Date.now(),
        onboarded: Boolean(found.account.onboarded),
        termsAccepted: true,
        privacyAccepted: true,
        marketingAccepted: Boolean(found.account.marketing),
        kakaoId: kakaoId || stateRef.current.kakaoId || "",
      };
      const pulled = await pullAccount(found.account.id, next.alerts);
      if (pulled.status === "ok" && pulled.data) {
        const remote = pulled.data;
        next = {
          ...next,
          onboarded: remote.onboarded || next.onboarded,
          marketingAccepted: remote.marketing || next.marketingAccepted,
          alerts: remote.alerts ?? next.alerts,
          subscriptions: remote.subscriptions,
          events: remote.events,
          notices: remote.notices,
          seeded: remote.subscriptions.length > 0,
        };
      }
      setState(withNotices(next));
      skipPush.current = false;
      return { ok: true };
    }

    if (local) {
      sessionStorage.removeItem(SESSION_FLAG);
      touch();
      skipPush.current = true;
      setState(withNotices({
        ...stateRef.current,
        email: trimmed,
        loggedIn: true,
        loginAt: Date.now(),
        termsAccepted: true,
        privacyAccepted: true,
        kakaoId: kakaoId || stateRef.current.kakaoId || "",
      }));
      skipPush.current = false;
      return { ok: true };
    }

    const password = `TeumSoc1!${uid("pw").slice(-6)}`;
    const created = await signup(trimmed, password, false);
    if (created.ok) {
      if (kakaoId) setState((s) => ({ ...s, kakaoId }));
      return created;
    }
    rememberUser(trimmed, password);
    sessionStorage.removeItem(SESSION_FLAG);
    touch();
    skipPush.current = true;
    setState(withNotices({
      ...empty(),
      accountId: uid("acc"),
      email: trimmed,
      loggedIn: true,
      loginAt: Date.now(),
      onboarded: false,
      termsAccepted: true,
      privacyAccepted: true,
      marketingAccepted: false,
      alerts: defaultAlerts(),
      kakaoId,
    }));
    skipPush.current = false;
    return { ok: true };
  }, [rememberUser, signup, users]);

  const emailRegistered: Store["emailRegistered"] = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase();
    const cloud = await emailOnCloud(trimmed);
    if (cloud.status === "ok") return Boolean(cloud.found);
    return users.some((u) => String(u.email ?? "").toLowerCase() === trimmed);
  }, [users]);

  const resetPassword: Store["resetPassword"] = useCallback(async (email, password) => {
    const trimmed = email.trim().toLowerCase();
    const cloud = await resetPasswordCloud(trimmed, password);
    if (cloud === "error") return { ok: false, error: "서버가 불안정합니다. 잠시 후 다시 시도해주세요." };
    rememberUser(trimmed, password);
    if (cloud !== "off") setCloudStatus(cloud);
    return { ok: true };
  }, [rememberUser]);

  const logout = useCallback(() => {
    touch();
    setState((s) => ({ ...s, loggedIn: false, loginAt: null }));
  }, []);

  const withdraw = useCallback(async () => {
    const id = stateRef.current.accountId;
    const mail = stateRef.current.email;
    const kakaoId = stateRef.current.kakaoId ?? "";
    touch();
    if (kakaoId) {
      try {
        await fetch("/api/auth/kakao/unlink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kakaoId }),
        });
      } catch { /* unlink best-effort */ }
    }
    await deleteAccount(id, mail);
    setUsers((u) => u.filter((x) => x.email !== mail || x.email === DEMO_EMAIL));
    skipPush.current = true;
    setState(empty());
  }, []);

  const setOnboarded = useCallback((marketing: boolean) => {
    touch();
    setState((s) => ({
      ...s,
      onboarded: true,
      marketingAccepted: marketing,
      alerts: { ...s.alerts, marketing, benefit: marketing },
    }));
  }, []);

  const setAlerts = useCallback((p: Partial<AlertPrefs>) => {
    touch();
    setState((s) => withNotices({ ...s, alerts: { ...s.alerts, ...p } }));
  }, []);

  const upsertSub = useCallback((sub: Subscription) => {
    if (!Number.isFinite(sub.amount) || sub.amount < 0 || sub.amount > 99999999 || !Number.isInteger(sub.amount)) return;
    touch();
    setState((s) => {
      const exists = s.subscriptions.some((x) => x.id === sub.id);
      const subscriptions = exists
        ? s.subscriptions.map((x) => (x.id === sub.id ? sub : x))
        : [sub, ...s.subscriptions];
      return withNotices({ ...s, subscriptions });
    });
  }, []);

  const removeSub = useCallback((id: string) => {
    touch();
    setState((s) => withNotices({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
  }, []);

  const upsertEvent = useCallback((ev: LifeEvent) => {
    touch();
    setState((s) => {
      const exists = s.events.some((x) => x.id === ev.id);
      const events = exists ? s.events.map((x) => (x.id === ev.id ? ev : x)) : [ev, ...s.events];
      return { ...s, events };
    });
  }, []);

  const removeEvent = useCallback((id: string) => {
    touch();
    setState((s) => ({ ...s, events: s.events.filter((x) => x.id !== id) }));
  }, []);

  const markNotice = useCallback((id: string) => {
    touch();
    setState((s) => ({
      ...s,
      notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotices = useCallback(() => {
    touch();
    setState((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }));
  }, []);

  const setDraft = useCallback((d: Partial<DraftSub>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...d };
      if (d.payDay && !d.nextPay) {
        const day = Number(d.payDay);
        if (day >= 1 && day <= 31) next.nextPay = nextPayDate(day);
      }
      return next;
    });
  }, []);

  const resetDraft = useCallback(() => setDraftState(emptyDraft()), []);

  const simulateFail = useCallback(() => {
    setFailOnce(true);
    return true;
  }, []);

  const retryPull = useCallback(() => {
    if (stateRef.current.loggedIn) void runPull(stateRef.current.accountId);
  }, [runPull]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      cloudStatus,
      querying,
      toast,
      draft,
      failOnce,
      users,
      showToast,
      clearToast,
      login,
      loginSocial,
      signup,
      emailRegistered,
      resetPassword,
      logout,
      withdraw,
      setOnboarded,
      setAlerts,
      upsertSub,
      removeSub,
      upsertEvent,
      removeEvent,
      markNotice,
      markAllNotices,
      setDraft,
      resetDraft,
      seedDemo,
      simulateFail,
      retryPull,
    }),
    [
      state,
      hydrated,
      cloudStatus,
      querying,
      toast,
      draft,
      failOnce,
      users,
      showToast,
      clearToast,
      login,
      loginSocial,
      signup,
      emailRegistered,
      resetPassword,
      logout,
      withdraw,
      setOnboarded,
      setAlerts,
      upsertSub,
      removeSub,
      upsertEvent,
      removeEvent,
      markNotice,
      markAllNotices,
      setDraft,
      resetDraft,
      seedDemo,
      simulateFail,
      retryPull,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore");
  return ctx;
}

export { SESSION_FLAG };
