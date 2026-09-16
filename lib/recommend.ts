import { type BundleProduct } from "./bundles";
import { isBundleLike } from "./catalog";
import { findBrand } from "./brands";
import { monthlyAmount } from "./stats";
import type { Benefit, Subscription } from "./types";

function partsOf(included: string) {
  return included.split(/[·+,/]/).map((s) => s.trim()).filter((s) => s.length >= 2);
}

function keysOf(token: string) {
  const brand = findBrand(token);
  const raw = [token, brand?.name, ...(brand?.aliases ?? [])].filter(Boolean) as string[];
  return raw.map((s) => s.replace(/\s/g, "").toLowerCase()).filter((s) => s.length >= 2);
}

function owns(names: string[], token: string) {
  const keys = keysOf(token);
  return names.some((name) => {
    const x = name.replace(/\s/g, "").toLowerCase();
    return keys.some((n) => x.includes(n) || n.includes(x));
  });
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

function amountFor(live: Subscription[], token: string) {
  const sub = live.find((s) => owns([s.name], token));
  if (sub) return sub.amount;
  return findBrand(token)?.amount ?? 0;
}

function alreadyHasBundle(live: Subscription[], id: string, name: string) {
  return live.some((s) => s.bundleId === id || (isBundleLike(s) && (s.name === name || s.included === name)));
}

function capSave(save: number, live: Subscription[]) {
  const total = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  return Math.min(Math.max(0, save), total);
}

export function bundleTips(subs: Subscription[], benefits?: Benefit[] | null, catalog?: BundleProduct[] | null): BundleTip[] {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused);
  const names = live.map((s) => s.name);
  const out: BundleTip[] = [];

  if (benefits?.length) {
    for (const b of benefits) {
      if (alreadyHasBundle(live, b.id, b.title)) continue;
      const parts = [b.parent?.name, b.perk?.name].filter((n): n is string => Boolean(n));
      if (parts.length === 0) continue;
      const hits = parts.filter((p) => owns(names, p));
      if (hits.length === 0) continue;
      const solo = parts.reduce((sum, p) => sum + amountFor(live, p), 0) || b.priceSingle || 0;
      const bundle = b.priceBundle ?? 0;
      const save = capSave(solo - bundle, live);
      if (save <= 0) continue;
      const colors = parts.map((p) => findBrand(p)?.color || b.brandColor || b.providerColor || "#2576f2");
      const carrier = b.kind === "carrier";
      const names = carrier
        ? [b.provider, b.perk?.name || b.parent?.name || ""].filter(Boolean)
        : parts;
      const logos = carrier
        ? [b.providerLogo || "", b.perkIcon || b.parentIcon || ""]
        : [b.parentIcon || "", b.perkIcon || ""];
      out.push({
        id: b.id,
        href: `/benefits/${b.id}`,
        headline: b.title,
        names,
        colors: carrier ? [b.providerColor || colors[0], colors[1] || colors[0]] : colors,
        logos,
        solo,
        bundle,
        save,
      });
    }
    return out.sort((a, b) => b.save - a.save).slice(0, 6);
  }

  const products = catalog ?? [];
  for (const product of products) {
    if (alreadyHasBundle(live, product.id, product.name)) continue;
    const parts = partsOf(product.included);
    const hits = parts.filter((p) => owns(names, p));
    if (hits.length === 0) continue;
    const solo = parts.reduce((sum, p) => sum + amountFor(live, p), 0);
    const save = capSave(solo - product.amount, live);
    if (save <= 0) continue;
    out.push({
      id: product.id,
      href: `/benefits/${product.id}`,
      headline: product.name,
      names: parts.slice(0, 2),
      colors: parts.slice(0, 2).map((p) => findBrand(p)?.color || "#2576f2"),
      solo,
      bundle: product.amount,
      save,
    });
  }
  return out.sort((a, b) => b.save - a.save).slice(0, 6);
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
