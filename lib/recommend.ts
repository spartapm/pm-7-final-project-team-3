import { type BundleProduct } from "./bundles";
import { isBundleLike } from "./catalog";
import { findBrand } from "./brands";
import { monthlyAmount } from "./stats";
import type { Benefit, Subscription } from "./types";

function partsOf(included: string) {
  return included
    .split(/[·+,/|&]| 그리고 | 및 | 과 | 와 /)
    .map((s) => s.replace(/\s*중\s*\d+개?\s*$/g, "").replace(/통합형|광고형|스탠다드|베이직|라이트|추가혜택|생활혜택|상품권.*/g, "").trim())
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

function keysOf(token: string) {
  const t = String(token ?? "");
  const brand = findBrand(t);
  const raw = [t, brand?.name, ...(brand?.aliases ?? [])].filter(Boolean) as string[];
  return raw.map((s) => String(s).replace(/\s/g, "").toLowerCase()).filter((s) => s.length >= 2);
}

function owns(names: string[], token: string) {
  const keys = keysOf(String(token ?? ""));
  if (keys.length === 0) return false;
  return names.some((name) => {
    const x = String(name ?? "").replace(/\s/g, "").toLowerCase();
    return keys.some((n) => x.includes(n) || n.includes(x));
  });
}

function uniqueParts(parts: string[]) {
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (out.some((p) => owns([p], part) || owns([part], p))) continue;
    out.push(part);
  }
  return out;
}

export type BundleTip = {
  id: string;
  href: string;
  headline: string;
  names: string[];
  colors: string[];
  logos?: string[];
  solo: number;
  bundle: number;
  save: number;
};

function liveMonthly(live: Subscription[], token: string) {
  const sub = live.find((s) => owns([s.name], token));
  if (!sub || sub.status === "trial") return 0;
  return monthlyAmount(sub.amount, sub.cycle);
}

function alreadyHasBundle(live: Subscription[], id: string, name: string) {
  return live.some((s) => s.bundleId === id || (isBundleLike(s) && (s.name === name || s.included === name)));
}

function capSave(save: number, live: Subscription[]) {
  const total = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  return Math.min(Math.max(0, save), total || Math.max(0, save));
}

function partsFromBenefit(b: Benefit, catalog?: BundleProduct[] | null) {
  const named = [b.parent?.name, b.perk?.name].filter((n): n is string => Boolean(n?.trim()));
  const row = catalog?.find((p) => p.id === b.id);
  const fromIncluded = row?.included ? partsOf(row.included) : [];
  const fromTitle = partsOf([row?.name, b.title].filter(Boolean).join(" · "));
  const merged = uniqueParts([...named, ...fromIncluded, ...fromTitle]);
  if (merged.length >= 2) return merged;
  if (named.length) return named;
  if (fromIncluded.length) return fromIncluded;
  return fromTitle;
}

function advertisedSave(solo: number, bundle: number, live: Subscription[]) {
  if (solo <= 0) return 0;
  if (bundle <= 0) return capSave(solo, live);
  return capSave(solo - bundle, live);
}

/** 결합 구성품을 유저가 모두 갖고 있을 때만 추천 */
function qualifiesAll(parts: string[], names: string[]) {
  const concrete = parts.filter((p) => findBrand(p) || names.some((n) => owns([n], p)));
  const need = concrete.length >= 2 ? concrete : parts;
  if (need.length < 2) return false;
  return need.every((p) => owns(names, p));
}

function pushCatalogTips(out: BundleTip[], live: Subscription[], names: string[], catalog: BundleProduct[]) {
  for (const product of catalog) {
    if (alreadyHasBundle(live, product.id, product.name)) continue;
    if (out.some((t) => t.id === product.id)) continue;
    const parts = uniqueParts([...partsOf(product.included), ...partsOf(product.name)]);
    if (!qualifiesAll(parts, names)) continue;
    const matched = parts.filter((p) => owns(names, p));
    const solo = matched.reduce((sum, p) => sum + liveMonthly(live, p), 0);
    if (solo <= 0) continue;
    const save = advertisedSave(solo, product.amount, live);
    if (save <= 0) continue;
    out.push({
      id: product.id,
      href: `/benefits/${product.id}`,
      headline: product.name,
      names: matched.slice(0, 2),
      colors: matched.slice(0, 2).map((p) => findBrand(p)?.color || "#2576f2"),
      solo,
      bundle: product.amount,
      save,
    });
  }
}

export function bundleTips(subs: Subscription[], benefits?: Benefit[] | null, catalog?: BundleProduct[] | null): BundleTip[] {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const names = live.map((s) => s.name);
  const out: BundleTip[] = [];
  const products = catalog ?? [];

  if (benefits?.length) {
    for (const b of benefits) {
      if (alreadyHasBundle(live, b.id, b.title)) continue;
      const parts = partsFromBenefit(b, products);
      if (!qualifiesAll(parts, names)) continue;
      const matched = parts.filter((p) => owns(names, p));
      const liveSolo = matched.reduce((sum, p) => sum + liveMonthly(live, p), 0);
      if (liveSolo <= 0) continue;
      const solo = liveSolo;
      const bundle = b.priceBundle ?? 0;
      const save = advertisedSave(solo, bundle, live);
      if (save <= 0) continue;
      const colors = matched.map((p) => findBrand(p)?.color || b.brandColor || b.providerColor || "#2576f2");
      const carrier = b.kind === "carrier";
      const tipNames = matched.length >= 2
        ? matched.slice(0, 2)
        : carrier
          ? [b.provider, b.perk?.name || b.parent?.name || matched[0] || ""].filter(Boolean)
          : matched;
      const logos = tipNames.map((name) => {
        if (owns([b.parent?.name || ""], name)) return b.parentIcon || "";
        if (owns([b.perk?.name || ""], name)) return b.perkIcon || "";
        if (carrier && owns([b.provider], name)) return b.providerLogo || "";
        return "";
      });
      out.push({
        id: b.id,
        href: `/benefits/${b.id}`,
        headline: b.title,
        names: tipNames,
        colors: tipNames.map((_, i) => colors[i] || b.providerColor || "#2576f2"),
        logos,
        solo,
        bundle,
        save,
      });
    }
  }

  if (products.length) {
    pushCatalogTips(out, live, names, products);
  }

  return out.sort((a, b) => b.save - a.save || a.headline.localeCompare(b.headline)).slice(0, 6);
}

export function tipSavingsTotal(tips: BundleTip[]) {
  return tips.reduce((sum, t) => sum + Math.max(0, t.save), 0);
}

export function relevantBenefits(subs: Subscription[], benefitIds: string[]) {
  const live = subs.filter((s) => s.status !== "ended");
  const names = live.map((s) => s.name);
  return benefitIds.filter((id) => {
    const tokens = id.split("-");
    return tokens.some((t) => owns(names, t));
  });
}

export { isBundleLike };
