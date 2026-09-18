import type { BundleProduct } from "./bundles";
import {
  type CatalogCategory,
  type CatalogCategoryRow,
  DEFAULT_BENEFIT_FILTERS,
  rowToCategory,
} from "./catalog-cats";
import type { Benefit, BenefitKind } from "./types";
import { publicIcon } from "./catalog-storage";
import { getSupabase, isMissingTable } from "./supabase";

export type ProviderRow = {
  provider_id: number;
  provider_name: string;
  provider_type: string;
  logo_url: string;
  official_url: string;
  brand_color: string;
  is_active: boolean;
};

export type ProductPlanRow = {
  plan_id: number;
  product_id: number;
  plan_name: string;
  price_standard: number;
  sort_order: number;
};

export type ProductRow = {
  product_id: number;
  provider_id: number | null;
  product_name: string;
  product_name_en?: string;
  category: string;
  product_type: string;
  price_standard: number;
  icon?: string;
  official_url: string;
  is_active: boolean;
  provider?: ProviderRow | null;
  plans?: ProductPlanRow[];
  serviceCategoryIds?: number[];
  benefitCategoryIds?: number[];
};

export type BundleRow = {
  bundle_id: number;
  bundle_name: string;
  category: string;
  card_title: string;
  card_body: string;
  icon: string;
  price_bundled: number;
  apply_method: string;
  requirement: string;
  official_url: string;
  expires: string | null;
  is_active: boolean;
  serviceCategoryIds?: number[];
  benefitCategoryIds?: number[];
};

export type BundleItemRow = {
  bundle_id: number;
  product_id: number;
  item_role: string;
  required: boolean;
  product?: ProductRow | null;
};

export type PromotionRow = {
  promotion_id: number;
  product_id: number | null;
  promotion_name: string;
  price_discount: number | null;
  discount_amount: number | null;
  apply_method: string;
  requirement: string;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
};

const PROVIDER_COLOR: Record<string, string> = {
  SKT: "#E31837",
  KT: "#E8630A",
  "LG U+": "#E6007E",
  쿠팡: "#A16207",
  Naver: "#03C75A",
  NAVER: "#03C75A",
  네이버: "#03C75A",
};

export function kindOf(category: string): BenefitKind {
  if (/통신/.test(category)) return "carrier";
  if (/카드/.test(category)) return "card";
  return "commerce";
}

function fallbackBenefitNames(category: string) {
  if (/통신/.test(category)) return ["통신사 결합"];
  if (/카드/.test(category)) return ["카드 혜택"];
  if (/엔터/.test(category)) return ["엔터"];
  if (/AI/.test(category)) return ["생성형 AI"];
  if (/학습/.test(category)) return ["일·학습"];
  if (/커머스/.test(category)) return ["일상·생활"];
  return category ? [category] : ["일상·생활"];
}

function idsOf(maps: { id: number; category_id: number }[], id: number, cats: CatalogCategory[], kind: "service" | "benefit") {
  const set = new Set(maps.filter((m) => m.id === id).map((m) => m.category_id));
  return cats.filter((c) => c.kind === kind && set.has(c.id)).map((c) => c.id);
}

function splitLines(raw: unknown) {
  return String(raw ?? "").split(/\r?\n/).map((s) => s.replace(/^\s*[-•\d.]+\s*/, "").trim()).filter(Boolean);
}

function money(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function bundleToBenefit(
  b: BundleRow,
  items: BundleItemRow[],
  benefitNames: string[] = [],
): Benefit {
  const primary = items.find((i) => i.item_role === "PRIMARY") ?? items[0];
  const perk = items.find((i) => i.item_role === "BENEFIT") ?? items[1];
  const category = String(b.category ?? "");
  const names = benefitNames.filter(Boolean);
  const provider = primary?.product?.provider?.provider_name
    || category.replace(" 결합", "").replace(" 멤버십", "")
    || "틈";
  const color = primary?.product?.provider?.brand_color
    || PROVIDER_COLOR[provider]
    || "#2576f2";
  const solo = items.reduce((sum, i) => sum + money(i.product?.price_standard), 0);
  const title = String(b.card_title || b.bundle_name || "");
  const body = String(b.card_body || "");
  const steps = splitLines(b.apply_method);
  const terms = splitLines(b.requirement);
  const expires = b.expires && /^\d{4}-\d{2}-\d{2}/.test(b.expires) ? b.expires.slice(0, 10) : undefined;
  return {
    id: `b-${b.bundle_id}`,
    kind: kindOf(names[0] || category),
    benefitCategories: names.length ? names : fallbackBenefitNames(category),
    provider,
    providerColor: color,
    title,
    body,
    href: b.official_url || "",
    icon: publicIcon(b.icon),
    expires,
    howTo: steps.join(" "),
    terms: terms.join(" "),
    officialUrl: b.official_url || "",
    brandColor: color,
    parent: primary?.product ? { name: primary.product.product_name, sub: "월 자동결제" } : undefined,
    perk: perk?.product ? { name: perk.product.product_name, sub: perk.item_role === "BENEFIT" ? "혜택상품" : "월 정기결제" } : undefined,
    providerLogo: publicIcon(primary?.product?.provider?.logo_url),
    parentIcon: publicIcon(primary?.product?.icon),
    perkIcon: publicIcon(perk?.product?.icon),
    priceSingle: solo || money(b.price_bundled),
    priceBundle: money(b.price_bundled),
    steps: steps.length ? steps : undefined,
    termsList: terms.length ? terms : undefined,
    source: "제공사 공식 안내 · 틈 어드민",
    asOf: "2026.09.01",
  };
}

export function bundleRowsToProducts(bundles: BundleRow[], items: BundleItemRow[]): BundleProduct[] {
  return bundles.filter((b) => b.is_active).map((b) => {
    const names = items
      .filter((i) => i.bundle_id === b.bundle_id)
      .map((i) => i.product?.product_name)
      .filter((n): n is string => Boolean(n));
    const rowItems = items.filter((i) => i.bundle_id === b.bundle_id);
    const primary = rowItems.find((i) => i.item_role === "PRIMARY") ?? rowItems[0];
    return {
      id: `b-${b.bundle_id}`,
      providerId: String(primary?.product?.provider_id ?? b.category),
      name: b.bundle_name,
      included: names.join(", ") || b.card_title || b.bundle_name,
      amount: money(b.price_bundled),
      everyMonths: 1,
    };
  });
}

const EMPTY_CATALOG = {
  providers: [] as ProviderRow[],
  products: [] as ProductRow[],
  bundles: [] as BundleRow[],
  items: [] as BundleItemRow[],
  promotions: [] as PromotionRow[],
  benefits: [] as Benefit[],
  bundleProducts: [] as BundleProduct[],
  categories: [] as CatalogCategory[],
  benefitFilters: [...DEFAULT_BENEFIT_FILTERS] as string[],
};

export async function loadCatalog() {
  const sb = getSupabase();
  if (!sb) return { status: "off" as const, ...EMPTY_CATALOG };

  try {
  const [providers, products, bundles, items, promotions, plans, cats, pc, bc] = await Promise.all([
    sb.from("provider").select("*").order("provider_id"),
    sb.from("product").select("*").order("product_id"),
    sb.from("bundle_product").select("*").order("bundle_id"),
    sb.from("bundle_item").select("*"),
    sb.from("product_promotion").select("*").order("promotion_id"),
    sb.from("product_plan").select("*").order("sort_order"),
    sb.from("catalog_category").select("*").order("sort_order"),
    sb.from("product_category").select("product_id, category_id"),
    sb.from("bundle_category").select("bundle_id, category_id"),
  ]);

  const err = providers.error || products.error || bundles.error || items.error || promotions.error;
  if (err) {
    if (isMissingTable(err)) return { status: "missing-table" as const, ...EMPTY_CATALOG };
    return { status: "error" as const, ...EMPTY_CATALOG };
  }

  const planRows = plans.error ? [] as ProductPlanRow[] : ((plans.data ?? []) as ProductPlanRow[]);
  const providerRows = ((providers.data ?? []) as ProviderRow[]).map((p) => ({
    ...p,
    logo_url: publicIcon(p.logo_url),
  }));
  const catRows = cats.error ? [] as CatalogCategory[] : ((cats.data ?? []) as CatalogCategoryRow[]).map((r) => rowToCategory(r));
  const productMaps = (pc.error ? [] : (pc.data ?? [])).map((r) => ({
    id: Number((r as { product_id: number }).product_id),
    category_id: Number((r as { category_id: number }).category_id),
  }));
  const bundleMaps = (bc.error ? [] : (bc.data ?? [])).map((r) => ({
    id: Number((r as { bundle_id: number }).bundle_id),
    category_id: Number((r as { category_id: number }).category_id),
  }));
  const productRows = ((products.data ?? []) as ProductRow[]).map((p) => ({
    ...p,
    product_name_en: p.product_name_en ?? "",
    icon: publicIcon(p.icon),
    provider: providerRows.find((x) => x.provider_id === p.provider_id) ?? null,
    plans: planRows.filter((x) => x.product_id === p.product_id),
    serviceCategoryIds: idsOf(productMaps, p.product_id, catRows, "service"),
    benefitCategoryIds: idsOf(productMaps, p.product_id, catRows, "benefit"),
  }));
  const bundleRows = ((bundles.data ?? []) as BundleRow[]).map((b) => ({
    ...b,
    icon: publicIcon(b.icon),
    serviceCategoryIds: idsOf(bundleMaps, b.bundle_id, catRows, "service"),
    benefitCategoryIds: idsOf(bundleMaps, b.bundle_id, catRows, "benefit"),
  }));
  const itemRows = ((items.data ?? []) as BundleItemRow[]).map((i) => ({
    ...i,
    product: productRows.find((p) => p.product_id === i.product_id) ?? null,
  }));
  const promotionRows = (promotions.data ?? []) as PromotionRow[];
  const visibleBenefit = catRows.filter((c) => c.kind === "benefit" && c.appVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const benefitFilters = visibleBenefit.length
    ? ["전체", ...visibleBenefit.map((c) => c.name)]
    : [...DEFAULT_BENEFIT_FILTERS];

  const benefits = bundleRows
    .filter((b) => b.is_active)
    .map((b) => {
      const names = catRows.filter((c) => (b.benefitCategoryIds ?? []).includes(c.id)).map((c) => c.name);
      return bundleToBenefit(b, itemRows.filter((i) => i.bundle_id === b.bundle_id), names);
    });
  const bundleProducts = bundleRowsToProducts(bundleRows, itemRows);

  return {
    status: "ok" as const,
    providers: providerRows,
    products: productRows,
    bundles: bundleRows,
    items: itemRows,
    promotions: promotionRows,
    benefits,
    bundleProducts,
    categories: catRows,
    benefitFilters,
  };
  } catch {
    return { status: "error" as const, ...EMPTY_CATALOG };
  }
}
