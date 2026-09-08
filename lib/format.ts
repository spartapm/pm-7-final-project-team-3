export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function nextPayDate(payDay: number, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), payDay);
  if (d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    return ymd(addMonths(d, 1));
  }
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(payDay, last));
  return ymd(d);
}

export function ensureFuturePay(nextPay: string, payDay: number, cycle: string) {
  if (!nextPay) return nextPayDate(payDay);
  if (daysUntil(nextPay) >= 0) return nextPay;
  if (cycle === "weekly") {
    const d = parseYmd(nextPay);
    while (daysUntil(ymd(d)) < 0) d.setDate(d.getDate() + 7);
    return ymd(d);
  }
  if (cycle === "yearly") {
    const d = parseYmd(nextPay);
    while (daysUntil(ymd(d)) < 0) d.setFullYear(d.getFullYear() + 1);
    return ymd(d);
  }
  return nextPayDate(payDay);
}

export function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function monthLabel(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function dateLabel(s: string) {
  const d = parseYmd(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function timeLabel(t: string) {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = mStr ?? "00";
  const ap = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${h12}:${m}`;
}

export function weekday(s: string) {
  return ["일", "월", "화", "수", "목", "금", "토"][parseYmd(s).getDay()];
}

export function fullDateLabel(s: string) {
  return `${dateLabel(s)} ${weekday(s)}요일`;
}

export function daysUntil(s: string) {
  const a = parseYmd(s);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function dueLabel(s: string) {
  const n = daysUntil(s);
  if (n === 0) return "오늘";
  if (n > 0) return `${n}일 후`;
  return `${-n}일 지남`;
}

export function dueBadge(s: string) {
  const n = daysUntil(s);
  if (n === 0) return "오늘";
  if (n > 0) return `D-${n}`;
  return `D+${-n}`;
}

export function relativeTime(at: number) {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}분 전`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

export function cycleLabel(c: string) {
  if (c === "yearly") return "연";
  if (c === "weekly") return "주";
  return "월";
}

export function cycleEvery(c: string) {
  if (c === "yearly") return "매년";
  if (c === "weekly") return "매주";
  return "매월";
}

export function thisWeek(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return {
      key: ymd(x),
      dow: ["월", "화", "수", "목", "금", "토", "일"][i],
      date: x.getDate(),
      today: ymd(x) === ymd(from),
    };
  });
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const cells: { key: string; date: number; inMonth: boolean; dow: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      key: ymd(d),
      date: d.getDate(),
      inMonth: d.getMonth() === month,
      dow: d.getDay(),
    });
  }
  return cells;
}
