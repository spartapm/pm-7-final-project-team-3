import { findBrand } from "./brands";
import { emptyDraft } from "./catalog";
import { nextPayDate, pad, uid } from "./format";
import type { AddKind, DraftSub, ExtractEventItem, ExtractItem, ExtractState, ExtractSubItem } from "./types";

const KEY = "teum:extract";

export function readExtract(): ExtractState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExtractState;
  } catch {
    return null;
  }
}

export function writeExtract(state: ExtractState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function clearExtract() {
  sessionStorage.removeItem(KEY);
}

export function markExtractDirty() {
  const cur = readExtract();
  if (!cur) return;
  writeExtract({ ...cur, dirty: true });
}

export function upsertExtractItem(item: ExtractItem) {
  const cur = readExtract();
  if (!cur) return;
  const exists = cur.items.some((x) => x.id === item.id);
  writeExtract({
    ...cur,
    dirty: true,
    items: exists ? cur.items.map((x) => (x.id === item.id ? item : x)) : [...cur.items, item],
  });
}

export function afterExtractPath(kind: AddKind, id: string) {
  return kind === "event" ? `/events/new?from=result&i=${id}` : `/add/confirm?from=result&i=${id}`;
}

export function emptySubItem(): ExtractSubItem {
  return {
    id: uid("ex"),
    kind: "subscription",
    name: "",
    plan: "",
    amount: "",
    day: null,
    nextPay: "",
    category: "ott",
    cycle: "monthly",
    payMethod: "",
    memo: "",
    alertDays: 0,
    trialDays: "",
    status: "active",
    needConfirm: true,
  };
}

export function emptyEventItem(): ExtractEventItem {
  return {
    id: uid("ex"),
    kind: "event",
    title: "",
    date: "",
    endDate: "",
    start: "",
    end: "",
    allDay: false,
    memo: "",
    alertMin: 30,
    needConfirm: true,
  };
}

function knownOf(name: string) {
  return findBrand(name);
}

export function subItemFromRaw(raw: {
  name?: string;
  plan?: string;
  amount?: string | number;
  day?: number | string | null;
  title?: string;
}): ExtractSubItem {
  const name = String(raw.name || raw.title || "").trim().slice(0, 30);
  const amount = String(raw.amount ?? "").replace(/[^\d]/g, "");
  const dayNum = typeof raw.day === "number" ? raw.day : Number(raw.day);
  const day = Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31 ? Math.trunc(dayNum) : null;
  const known = knownOf(name);
  return {
    ...emptySubItem(),
    name,
    plan: String(raw.plan || ""),
    amount,
    day,
    nextPay: day ? nextPayDate(day) : "",
    category: known?.category ?? "ott",
    needConfirm: !name || !day || !amount,
  };
}

function hmOf(v: unknown) {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function eventItemFromRaw(raw: {
  title?: string;
  name?: string;
  date?: string;
  endDate?: string;
  start?: string;
  end?: string;
}): ExtractEventItem {
  const title = String(raw.title || raw.name || "").trim().slice(0, 30);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date || "")) ? String(raw.date) : "";
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.endDate || "")) ? String(raw.endDate) : date;
  const start = hmOf(raw.start);
  const end = hmOf(raw.end);
  return {
    ...emptyEventItem(),
    title,
    date,
    endDate,
    start,
    end,
    allDay: !start && !end,
    needConfirm: !title || !date,
  };
}

export function draftFromSubItem(item: ExtractSubItem): DraftSub {
  return {
    ...emptyDraft(),
    name: item.name,
    plan: item.plan,
    category: item.category,
    amount: item.amount,
    cycle: item.cycle,
    payDay: item.day ? String(item.day) : "",
    nextPay: item.nextPay,
    memo: item.memo,
    status: item.status,
    alertDays: item.alertDays || 3,
    fromAi: true,
    payMethod: item.payMethod,
    trialDays: item.trialDays,
  };
}

export function subItemFromDraft(id: string, local: DraftSub, trialOn: boolean, alertOn: boolean): ExtractSubItem {
  const day = Number(local.nextPay.slice(8, 10)) || Number(local.payDay) || null;
  return {
    id,
    kind: "subscription",
    name: local.name.trim(),
    plan: local.plan,
    amount: local.amount.replace(/[^0-9]/g, ""),
    day,
    nextPay: local.nextPay,
    category: local.category,
    cycle: local.cycle,
    payMethod: local.payMethod,
    memo: local.memo,
    alertDays: alertOn ? (local.alertDays || 3) : 0,
    trialDays: trialOn ? local.trialDays : "",
    status: trialOn ? "trial" : local.status,
    needConfirm: !local.name.trim() || !local.nextPay || !(trialOn || local.amount.replace(/[^0-9]/g, "")),
  };
}

export function eventItemFromForm(id: string, v: {
  title: string;
  date: string;
  endDate: string;
  start: string;
  end: string;
  allDay: boolean;
  memo: string;
  alertMin: number;
}): ExtractEventItem {
  return {
    id,
    kind: "event",
    title: v.title.trim(),
    date: v.date,
    endDate: v.endDate || v.date,
    start: v.start,
    end: v.end,
    allDay: v.allDay,
    memo: v.memo,
    alertMin: v.alertMin,
    needConfirm: !v.title.trim() || !v.date,
  };
}

export function parseVoiceItems(raw: string, kind: AddKind): ExtractItem[] {
  const text = raw.trim();
  if (!text) return [];
  if (kind === "event") {
    const m = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    const title = text.replace(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/g, "").replace(/\s+/g, " ").trim().slice(0, 30) || text.slice(0, 30);
    const y = new Date().getFullYear();
    const date = m ? `${y}-${pad(Number(m[1]))}-${pad(Number(m[2]))}` : "";
    return [eventItemFromRaw({ title, date })];
  }
  const amount = text.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/)?.[1]?.replace(/,/g, "") ?? "";
  const dayHit = text.match(/매월\s*(\d{1,2})\s*일/) ?? text.match(/(\d{1,2})\s*일(?:에|마다)?/);
  const day = dayHit ? Number(dayHit[1]) : null;
  const name = /유튜브|youtube/i.test(text)
    ? "YouTube Premium"
    : /스포티|spotify/i.test(text)
      ? "Spotify"
      : /넷플릭|netflix/i.test(text)
        ? "Netflix"
        : /디즈니|disney/i.test(text)
          ? "Disney+"
          : /챗|chatgpt|gpt/i.test(text)
            ? "ChatGPT"
            : text.replace(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/g, "").replace(/매월\s*\d{1,2}\s*일/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
  return [subItemFromRaw({ name, amount, day })];
}

export function beginExtract(kind: AddKind, from: ExtractState["from"], items: ExtractItem[]) {
  writeExtract({
    kind,
    from,
    items,
    dirty: false,
    origin: JSON.stringify(items.map((x) => x.id)),
  });
}
