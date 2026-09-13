import { BUNDLE_PRODUCTS, type BundleProduct } from "./bundles";
import { isBundleLike } from "./catalog";
import { findBrand } from "./brands";
import type { Subscription } from "./types";

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

export function bundleTips(subs: Subscription[], catalog?: BundleProduct[] | null) {
  const products = catalog === undefined ? BUNDLE_PRODUCTS : catalog ?? [];
  const live = subs.filter((s) => s.status !== "ended" && !s.paused);
  const names = live.map((s) => s.name);
  const out: { product: BundleProduct; hits: string[]; save: number }[] = [];
  for (const product of products) {
    if (live.some((s) => s.bundleId === product.id || s.name === product.name)) continue;
    const parts = partsOf(product.included);
    const hits = parts.filter((p) => owns(names, p));
    if (hits.length === 0) continue;
    const solo = hits.reduce((sum, h) => {
      const brand = findBrand(h);
      const sub = live.find((s) => owns([s.name], h));
      return sum + (sub?.amount || brand?.amount || 0);
    }, 0);
    const save = Math.max(0, solo - product.amount);
    out.push({ product, hits, save });
  }
  return out.sort((a, b) => b.hits.length - a.hits.length || b.save - a.save).slice(0, 4);
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
