import { type BundleProduct } from "./bundles";
import { isBundleLike } from "./catalog";
import { findBrand } from "./brands";
import { monthlyAmount } from "./stats";
import type { Benefit, Subscription } from "./types";

function partsOf(included: string) {
  return included.split(/[·+,/|&]/).map((s) => s.trim()).filter((s) => s.length >= 2);
}

function keysOf(token: string) {
  const t = String(token ?? "");
  const brand = findBrand(t);
  const raw = [t, brand?.name, ...(brand?.aliases ?? [])].filter(Boolean) as string[];
  return raw.map((s) => String(s).replace(/\s/g, "").toLowerCase()).filter((s) => s.length >= 2);
}

function owns(names: string[], token: string) {
  const keys = keysOf(String(token ?? ""));
  return names.some((name) => {
    const x = String(name ?? "").replace(/\s/g, "").toLowerCase();
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
  return Math.min(Math.max(0, save), total || Math.max(0, save));
}

function partsFromBenefit(b: Benefit, catalog?: BundleProduct[] | null) {
  const named = [b.parent?.name, b.perk?.name].filter((n): n is string => Boolean(n?.trim()));
  if (named.length) return named;
  const row = catalog?.find((p) => p.id === b.id);
  if (row?.included) {
    const fromCatalog = partsOf(row.included);
    if (fromCatalog.length) return fromCatalog;
  }
  return partsOf([b.title, b.provider].filter(Boolean).join("·"));
}

function advertisedSave(solo: number, bundle: number, live: Subscription[]) {
  if (solo <= 0) return 0;
  if (bundle <= 0) return capSave(solo, live);
  return capSave(solo - bundle, live);
}

function pushCatalogTips(out: BundleTip[], live: Subscription[], names: string[], catalog: BundleProduct[]) {
  for (const product of catalog) {
    if (alreadyHasBundle(live, product.id, product.name)) continue;
    if (out.some((t) => t.id === product.id)) continue;
    const parts = partsOf(product.included);
    const hits = parts.filter((p) => owns(names, p));
    if (hits.length === 0) continue;
    const solo = parts.reduce((sum, p) => sum + amountFor(live, p), 0) || product.amount;
    const save = advertisedSave(solo, product.amount, live);
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
}

export function bundleTips(subs: Subscription[], benefits?: Benefit[] | null, catalog?: BundleProduct[] | null): BundleTip[] {
  const live = subs.filter((s) => s.status !== "ended" && !s.paused);
  const names = live.map((s) => s.name);
  const out: BundleTip[] = [];
  const products = catalog ?? [];

  if (benefits?.length) {
    for (const b of benefits) {
      if (alreadyHasBundle(live, b.id, b.title)) continue;
      const parts = partsFromBenefit(b, products);
      if (parts.length === 0) continue;
      const hits = parts.filter((p) => owns(names, p));
      if (hits.length === 0) continue;
      const liveSolo = parts.reduce((sum, p) => sum + amountFor(live, p), 0);
      const solo = b.priceSingle || liveSolo;
      const bundle = b.priceBundle ?? 0;
      const save = advertisedSave(solo, bundle, live);
      const colors = parts.map((p) => findBrand(p)?.color || b.brandColor || b.providerColor || "#2576f2");
      const carrier = b.kind === "carrier";
      const tipNames = carrier
        ? [b.provider, b.perk?.name || b.parent?.name || parts[0] || ""].filter(Boolean)
        : parts;
      const logos = carrier
        ? [b.providerLogo || "", b.perkIcon || b.parentIcon || ""]
        : [b.parentIcon || "", b.perkIcon || ""];
      out.push({
        id: b.id,
        href: `/benefits/${b.id}`,
        headline: b.title,
        names: tipNames,
        colors: carrier ? [b.providerColor || colors[0], colors[1] || colors[0]] : colors,
        logos,
        solo,
        bundle,
        save,
      });
    }
  }

  if (out.length === 0 && products.length) {
    pushCatalogTips(out, live, names, products);
  }

  return out.sort((a, b) => b.save - a.save || a.headline.localeCompare(b.headline)).slice(0, 6);
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
