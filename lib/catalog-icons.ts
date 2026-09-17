import { isImageIcon } from "./bundle-icon";

function compact(s: string) {
  return String(s ?? "").replace(/\s/g, "").toLowerCase();
}

let map = new Map<string, string>();

export function setCatalogIcons(rows: { name?: string | null; icon?: string | null }[]) {
  const next = new Map<string, string>();
  for (const row of rows) {
    const name = compact(row.name ?? "");
    const icon = (row.icon ?? "").trim();
    if (!name || !isImageIcon(icon)) continue;
    if (!next.has(name)) next.set(name, icon);
  }
  map = next;
}

export function catalogIcon(name: string) {
  const n = compact(name);
  if (!n) return undefined;
  const hit = map.get(n);
  if (hit) return hit;
  for (const [k, v] of map) {
    if (k.length >= 2 && (n.includes(k) || k.includes(n))) return v;
  }
  return undefined;
}
