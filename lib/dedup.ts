import { findBrand } from "./brands";
import { isBundleLike } from "./catalog";
import type { ServiceHit } from "./catalog";
import type { ExtractSubItem, Subscription } from "./types";

export type DupMatch = {
  extractedItemId: string;
  productName: string;
  isDuplicate: true;
  existingProductName: string;
  matchedType: "single" | "bundle";
};

function compact(s: string) {
  return s.replace(/[\s\-_/·,.]/g, "").toLowerCase();
}

function keysOf(token: string, catalog: ServiceHit[] = []) {
  const brand = findBrand(token);
  const family = catalog.find((p) => {
    const names = [p.name, p.nameEn, ...(p.plans ?? []).map((x) => `${p.name} ${x.name}`), ...(p.plans ?? []).map((x) => x.name)];
    return names.some((n) => n && (compact(n) === compact(token) || compact(token).includes(compact(n)) && compact(n).length >= 4));
  });
  const raw = [token, brand?.name, ...(brand?.aliases ?? []), family?.name, family?.nameEn].filter(Boolean) as string[];
  return raw.map(compact).filter((s) => s.length >= 2);
}

export function namesOverlap(a: string, b: string, catalog: ServiceHit[] = []) {
  const left = keysOf(a, catalog);
  const right = keysOf(b, catalog);
  return left.some((x) => right.some((y) => x === y || x.includes(y) || y.includes(x)));
}

function partsOf(included: string) {
  return included.split(/[·+,/]/).map((s) => s.trim()).filter((s) => s.length >= 2);
}

export function findDuplicate(item: ExtractSubItem, subs: Subscription[], catalog: ServiceHit[] = []): DupMatch | null {
  const name = item.name.trim();
  if (!name) return null;
  const live = subs.filter((s) => s.status !== "ended");
  for (const sub of live) {
    if (namesOverlap(name, sub.name, catalog)) {
      return {
        extractedItemId: item.id,
        productName: name,
        isDuplicate: true,
        existingProductName: sub.name,
        matchedType: isBundleLike(sub) ? "bundle" : "single",
      };
    }
    if (isBundleLike(sub) && sub.included) {
      const hit = partsOf(sub.included).find((part) => namesOverlap(name, part, catalog));
      if (hit) {
        return {
          extractedItemId: item.id,
          productName: name,
          isDuplicate: true,
          existingProductName: sub.name,
          matchedType: "bundle",
        };
      }
    }
  }
  return null;
}
