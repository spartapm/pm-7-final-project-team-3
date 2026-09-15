import { findBrand } from "./brands";
import { isBundleLike } from "./catalog";
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

function keysOf(token: string) {
  const brand = findBrand(token);
  const raw = [token, brand?.name, ...(brand?.aliases ?? [])].filter(Boolean) as string[];
  return raw.map(compact).filter((s) => s.length >= 2);
}

export function namesOverlap(a: string, b: string) {
  const left = keysOf(a);
  const right = keysOf(b);
  return left.some((x) => right.some((y) => x === y || x.includes(y) || y.includes(x)));
}

function partsOf(included: string) {
  return included.split(/[·+,/]/).map((s) => s.trim()).filter((s) => s.length >= 2);
}

export function findDuplicate(item: ExtractSubItem, subs: Subscription[]): DupMatch | null {
  const name = item.name.trim();
  if (!name) return null;
  const live = subs.filter((s) => s.status !== "ended");
  for (const sub of live) {
    if (namesOverlap(name, sub.name)) {
      return {
        extractedItemId: item.id,
        productName: name,
        isDuplicate: true,
        existingProductName: sub.name,
        matchedType: isBundleLike(sub) ? "bundle" : "single",
      };
    }
    if (isBundleLike(sub) && sub.included) {
      const hit = partsOf(sub.included).find((part) => namesOverlap(name, part));
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
