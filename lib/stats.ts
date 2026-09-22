import type { BundleProduct } from "./bundles";
import { bestBundleLeak } from "./recommend";
import type { Benefit, Subscription } from "./types";

export function monthlyAmount(amount: number, cycle: string) {
  if (cycle === "yearly") return Math.round(amount / 12);
  if (cycle === "weekly") return Math.round(amount * 4.33);
  return amount;
}

export function leaksOf(subs: { unused: boolean; amount: number; cycle: string; status: string; paused: boolean; parentId?: string }[]) {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const unused = live.filter((s) => s.unused && s.status !== "trial");
  const save = unused.reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  return { count: unused.length, save };
}

export function inspectLeaks(
  subs: Subscription[],
  benefits?: Benefit[] | null,
  bundles?: BundleProduct[] | null,
) {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const unused = live.filter((s) => s.unused && s.status !== "trial");
  const unusedSave = unused.reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  const best = benefits || bundles ? bestBundleLeak(live, benefits, bundles) : null;
  const bundleSave = best?.save ?? 0;
  const bundleCount = bundleSave > 0 ? 1 : 0;
  return {
    count: unused.length + bundleCount,
    save: unusedSave + bundleSave,
    unusedCount: unused.length,
    bundleSave,
    bundle: best,
  };
}

export function upcoming(subs: { nextPay: string; status: string; paused: boolean }[], n = 3) {
  return subs
    .filter((s) => s.status !== "ended" && !s.paused)
    .slice()
    .sort((a, b) => String(a.nextPay ?? "").localeCompare(String(b.nextPay ?? "")))
    .slice(0, n);
}
