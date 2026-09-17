import { getSupabase, isMissingTable } from "./supabase";
import {
  type CatalogCatKind,
  type CatalogCategory,
  type CatalogCategoryRow,
  numIds,
  rowToCategory,
} from "./catalog-cats";

export async function loadAdminCategories(): Promise<CatalogCategory[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const [cats, pc, bc] = await Promise.all([
    sb.from("catalog_category").select("*").order("sort_order"),
    sb.from("product_category").select("product_id, category_id"),
    sb.from("bundle_category").select("bundle_id, category_id"),
  ]);
  if (cats.error) {
    if (isMissingTable(cats.error)) return [];
    throw new Error(cats.error.message);
  }
  const counts = new Map<number, number>();
  const bump = (id: number) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const r of pc.data ?? []) bump(Number((r as { category_id: number }).category_id));
  for (const r of bc.data ?? []) bump(Number((r as { category_id: number }).category_id));
  return ((cats.data ?? []) as CatalogCategoryRow[]).map((r) => rowToCategory(r, counts.get(Number(r.category_id)) ?? 0));
}

export async function replaceCategoryMaps(kind: "product" | "bundle", id: number, categoryIds: number[]) {
  const sb = getSupabase();
  if (!sb) return;
  const table = kind === "product" ? "product_category" : "bundle_category";
  const col = kind === "product" ? "product_id" : "bundle_id";
  const del = await sb.from(table).delete().eq(col, id);
  if (del.error) {
    if (isMissingTable(del.error)) return;
    throw new Error(del.error.message);
  }
  const ids = [...new Set(numIds(categoryIds))];
  if (!ids.length) return;
  const ins = await sb.from(table).insert(ids.map((category_id) => ({ [col]: id, category_id })));
  if (ins.error) {
    if (isMissingTable(ins.error)) return;
    throw new Error(ins.error.message);
  }
}

export function firstCategoryName(ids: number[], cats: CatalogCategory[], kind: CatalogCatKind) {
  return cats
    .filter((c) => c.kind === kind && ids.includes(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.name ?? "";
}

export function categoryIdsOf(body: Record<string, unknown>, cats: CatalogCategory[]) {
  const serviceIds = numIds(body.service_category_ids);
  const benefitIds = numIds(body.benefit_category_ids);
  const category = firstCategoryName(serviceIds, cats, "service")
    || firstCategoryName(benefitIds, cats, "benefit")
    || String(body.category ?? "");
  return { serviceIds, benefitIds, allIds: [...serviceIds, ...benefitIds], category };
}
