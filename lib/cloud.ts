import type { AlertPrefs, AppState, LifeEvent, Notice, Subscription } from "./types";
import { getSupabase, isMissingTable } from "./supabase";

export type CloudStatus = "ok" | "missing-table" | "error" | "off";

export type CloudAccount = {
  id: string;
  email: string;
  onboarded: boolean;
  marketing: boolean;
  alerts: AlertPrefs;
  loginAt: number | null;
  subscriptions: Subscription[];
  events: LifeEvent[];
  notices: Notice[];
};

function toIso(ms: number | null) {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

function fromIso(iso: string | null | undefined, fallback = Date.now()) {
  if (!iso) return fallback;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? fallback : t;
}

function ymd(value: unknown) {
  return String(value ?? "").slice(0, 10);
}

function rowToSub(row: Record<string, unknown>): Subscription {
  const status = String(row.status ?? "active");
  return {
    id: String(row.id),
    name: String(row.name),
    plan: String(row.plan ?? ""),
    category: (row.category as Subscription["category"]) ?? "other",
    amount: Number(row.amount ?? 0),
    cycle: (row.cycle as Subscription["cycle"]) ?? "monthly",
    payDay: Number(row.pay_day ?? 1),
    nextPay: ymd(row.next_pay),
    status: status as Subscription["status"],
    autoRenew: Boolean(row.auto_renew),
    unused: Boolean(row.unused),
    memo: String(row.memo ?? ""),
    color: String(row.color ?? "#2576f2"),
    logo: String(row.logo ?? ""),
    trialEnds: row.trial_ends ? ymd(row.trial_ends) : null,
    paused: Boolean(row.paused) || status === "paused",
    alertDays: Number(row.alert_days ?? 3),
    createdAt: fromIso(row.created_at as string),
  };
}

function rowToEvent(row: Record<string, unknown>): LifeEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    date: ymd(row.date),
    start: String(row.start_time ?? ""),
    end: String(row.end_time ?? ""),
    allDay: Boolean(row.all_day),
    memo: String(row.memo ?? ""),
    createdAt: fromIso(row.created_at as string),
  };
}

function rowToNotice(row: Record<string, unknown>): Notice {
  const icon = String(row.icon ?? "pay");
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    at: fromIso(row.at as string),
    read: Boolean(row.read),
    href: String(row.href ?? "/home"),
    icon: (["pay", "warn", "gift", "trial", "price"].includes(icon) ? icon : "pay") as Notice["icon"],
    brand: row.brand ? String(row.brand) : undefined,
  };
}

function alertsOf(raw: unknown, fallback: AlertPrefs): AlertPrefs {
  if (!raw || typeof raw !== "object") return fallback;
  const a = raw as Record<string, unknown>;
  return {
    pay: a.pay !== false,
    renew: a.renew !== false,
    trial: a.trial !== false,
    benefit: a.benefit !== false,
    marketing: Boolean(a.marketing),
  };
}

export async function loginCloud(email: string, password: string): Promise<{
  status: CloudStatus;
  mismatch?: boolean;
  account?: { id: string; email: string; onboarded: boolean; marketing: boolean; alerts: unknown; login_at: string | null };
  message?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };
  const res = await sb.from("accounts").select("id, email, password, onboarded, marketing, alerts, login_at").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (res.error) {
    if (isMissingTable(res.error)) return { status: "missing-table" };
    return { status: "error", message: res.error.message };
  }
  if (!res.data || res.data.password !== password) return { status: "ok", mismatch: true };
  return { status: "ok", account: res.data };
}

export async function signupCloud(input: {
  id: string;
  email: string;
  password: string;
  marketing: boolean;
  alerts: AlertPrefs;
}): Promise<{ status: CloudStatus; exists?: boolean; message?: string }> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };
  const found = await sb.from("accounts").select("id").eq("email", input.email.trim().toLowerCase()).maybeSingle();
  if (found.error) {
    if (isMissingTable(found.error)) return { status: "missing-table" };
    return { status: "error", message: found.error.message };
  }
  if (found.data) return { status: "ok", exists: true };
  const ins = await sb.from("accounts").insert({
    id: input.id,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    onboarded: false,
    marketing: input.marketing,
    alerts: input.alerts,
    login_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (ins.error) {
    if (isMissingTable(ins.error)) return { status: "missing-table" };
    if (/duplicate|unique/i.test(ins.error.message)) return { status: "ok", exists: true };
    return { status: "error", message: ins.error.message };
  }
  return { status: "ok" };
}

export async function emailOnCloud(email: string): Promise<{ status: CloudStatus; found?: boolean }> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };
  const res = await sb.from("accounts").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (res.error) {
    if (isMissingTable(res.error)) return { status: "missing-table" };
    return { status: "error" };
  }
  return { status: "ok", found: Boolean(res.data) };
}

export async function resetPasswordCloud(email: string, password: string): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  const res = await sb.from("accounts").update({ password, updated_at: new Date().toISOString() }).eq("email", email.trim().toLowerCase());
  if (res.error) {
    if (isMissingTable(res.error)) return "missing-table";
    return "error";
  }
  return "ok";
}

export async function pullAccount(accountId: string, fallbackAlerts: AlertPrefs): Promise<{
  status: CloudStatus;
  data?: CloudAccount;
  message?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };

  const accountRes = await sb
    .from("accounts")
    .select("id, email, onboarded, marketing, alerts, login_at")
    .eq("id", accountId)
    .maybeSingle();
  if (accountRes.error) {
    if (isMissingTable(accountRes.error)) return { status: "missing-table" };
    return { status: "error", message: accountRes.error.message };
  }
  if (!accountRes.data) {
    return {
      status: "ok",
      data: {
        id: accountId,
        email: "",
        onboarded: false,
        marketing: false,
        alerts: fallbackAlerts,
        loginAt: null,
        subscriptions: [],
        events: [],
        notices: [],
      },
    };
  }

  const [subRes, eventRes, noticeRes] = await Promise.all([
    sb.from("subscriptions").select("*").eq("account_id", accountId),
    sb.from("events").select("*").eq("account_id", accountId),
    sb.from("notices").select("*").eq("account_id", accountId),
  ]);
  for (const res of [subRes, eventRes, noticeRes]) {
    if (res.error) {
      if (isMissingTable(res.error)) return { status: "missing-table" };
      return { status: "error", message: res.error.message };
    }
  }

  return {
    status: "ok",
    data: {
      id: accountRes.data.id,
      email: accountRes.data.email,
      onboarded: Boolean(accountRes.data.onboarded),
      marketing: Boolean(accountRes.data.marketing),
      alerts: alertsOf(accountRes.data.alerts, fallbackAlerts),
      loginAt: accountRes.data.login_at ? fromIso(accountRes.data.login_at) : null,
      subscriptions: (subRes.data ?? []).map(rowToSub),
      events: (eventRes.data ?? []).map(rowToEvent),
      notices: (noticeRes.data ?? []).map(rowToNotice),
    },
  };
}

export async function pushAccount(state: AppState): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  if (!state.loggedIn) return "ok";

  const acc = await sb.from("accounts").update({
    onboarded: state.onboarded,
    marketing: state.marketingAccepted,
    alerts: state.alerts,
    login_at: toIso(state.loginAt),
    updated_at: new Date().toISOString(),
  }).eq("id", state.accountId).select("id");
  if (acc.error) {
    if (isMissingTable(acc.error)) return "missing-table";
    console.error("[teum] accounts update", acc.error.message);
    return "error";
  }
  if (!acc.data?.length) return "ok";

  const [existingSubs, existingEvents, existingNotices] = await Promise.all([
    sb.from("subscriptions").select("id").eq("account_id", state.accountId),
    sb.from("events").select("id").eq("account_id", state.accountId),
    sb.from("notices").select("id").eq("account_id", state.accountId),
  ]);
  if (existingSubs.error || existingEvents.error || existingNotices.error) {
    if (isMissingTable(existingSubs.error) || isMissingTable(existingEvents.error) || isMissingTable(existingNotices.error)) {
      return "missing-table";
    }
    return "error";
  }

  const subIds = new Set(state.subscriptions.map((s) => s.id));
  const eventIds = new Set(state.events.map((e) => e.id));
  const noticeIds = new Set(state.notices.map((n) => n.id));
  const staleSubs = (existingSubs.data ?? []).map((r) => r.id).filter((id) => !subIds.has(id));
  const staleEvents = (existingEvents.data ?? []).map((r) => r.id).filter((id) => !eventIds.has(id));
  const staleNotices = (existingNotices.data ?? []).map((r) => r.id).filter((id) => !noticeIds.has(id));

  if (staleNotices.length) await sb.from("notices").delete().in("id", staleNotices);
  if (staleEvents.length) await sb.from("events").delete().in("id", staleEvents);
  if (staleSubs.length) await sb.from("subscriptions").delete().in("id", staleSubs);

  if (state.subscriptions.length) {
    const subUpsert = await sb.from("subscriptions").upsert(
      state.subscriptions.map((s) => ({
        id: s.id,
        account_id: state.accountId,
        name: s.name,
        plan: s.plan,
        category: s.category,
        amount: s.amount,
        cycle: s.cycle,
        pay_day: s.payDay,
        next_pay: s.nextPay,
        status: s.paused ? "paused" : s.status,
        auto_renew: s.autoRenew,
        unused: s.unused,
        memo: s.memo,
        color: s.color,
        logo: s.logo,
        trial_ends: s.trialEnds || null,
        paused: s.paused,
        alert_days: s.alertDays,
        created_at: toIso(s.createdAt) ?? new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
    if (subUpsert.error) {
      console.error("[teum] subscriptions upsert", subUpsert.error.message);
      if (isMissingTable(subUpsert.error)) return "missing-table";
      return "error";
    }
  }

  if (state.events.length) {
    const eventUpsert = await sb.from("events").upsert(
      state.events.map((e) => ({
        id: e.id,
        account_id: state.accountId,
        title: e.title,
        date: e.date,
        start_time: e.start,
        end_time: e.end,
        all_day: e.allDay,
        memo: e.memo,
        created_at: toIso(e.createdAt) ?? new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
    if (eventUpsert.error) {
      console.error("[teum] events upsert", eventUpsert.error.message);
      if (isMissingTable(eventUpsert.error)) return "missing-table";
      return "error";
    }
  }

  if (state.notices.length) {
    const noticeUpsert = await sb.from("notices").upsert(
      state.notices.map((n) => ({
        id: n.id,
        account_id: state.accountId,
        title: n.title,
        body: n.body,
        at: toIso(n.at) ?? new Date().toISOString(),
        read: n.read,
        href: n.href,
        icon: n.icon,
        brand: n.brand ?? null,
      })),
      { onConflict: "id" },
    );
    if (noticeUpsert.error) {
      console.error("[teum] notices upsert", noticeUpsert.error.message);
      if (isMissingTable(noticeUpsert.error)) return "missing-table";
      return "error";
    }
  }

  return "ok";
}

export async function deleteAccount(accountId: string): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  const res = await sb.from("accounts").delete().eq("id", accountId);
  if (res.error) {
    if (isMissingTable(res.error)) return "missing-table";
    return "error";
  }
  return "ok";
}
