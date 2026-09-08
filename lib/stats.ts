export function monthlyAmount(amount: number, cycle: string) {
  if (cycle === "yearly") return Math.round(amount / 12);
  if (cycle === "weekly") return Math.round(amount * 4.33);
  return amount;
}

export function leaksOf(subs: { unused: boolean; amount: number; cycle: string; status: string; paused: boolean }[]) {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused);
  const unused = live.filter((s) => s.unused);
  const save = unused.reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  return { count: unused.length, save };
}

export function upcoming(subs: { nextPay: string; status: string; paused: boolean }[], n = 3) {
  return subs
    .filter((s) => s.status !== "ended" && !s.paused)
    .slice()
    .sort((a, b) => a.nextPay.localeCompare(b.nextPay))
    .slice(0, n);
}
