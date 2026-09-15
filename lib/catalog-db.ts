import type { BundleProduct } from "./bundles";
import type { Benefit, BenefitKind } from "./types";
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

export type ProductRow = {
  product_id: number;
  provider_id: number | null;
  product_name: string;
  category: string;
  product_type: string;
  price_standard: number;
  icon?: string;
  official_url: string;
  is_active: boolean;
  provider?: ProviderRow | null;
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
): Benefit {
  const primary = items.find((i) => i.item_role === "PRIMARY") ?? items[0];
  const perk = items.find((i) => i.item_role === "BENEFIT") ?? items[1];
  const category = String(b.category ?? "");
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
    kind: kindOf(category),
    provider,
    providerColor: color,
    title,
    body,
    href: b.official_url || "",
    icon: b.icon || "",
    expires,
    howTo: steps.join(" "),
    terms: terms.join(" "),
    officialUrl: b.official_url || "",
    brandColor: color,
    parent: primary?.product ? { name: primary.product.product_name, sub: "월 자동결제" } : undefined,
    perk: perk?.product ? { name: perk.product.product_name, sub: perk.item_role === "BENEFIT" ? "혜택상품" : "월 정기결제" } : undefined,
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
};

export async function loadCatalog() {
  const sb = getSupabase();
  if (!sb) return { status: "off" as const, ...EMPTY_CATALOG };

  try {
  const [providers, products, bundles, items, promotions] = await Promise.all([
    sb.from("provider").select("*").order("provider_id"),
    sb.from("product").select("*").order("product_id"),
    sb.from("bundle_product").select("*").order("bundle_id"),
    sb.from("bundle_item").select("*"),
    sb.from("product_promotion").select("*").order("promotion_id"),
  ]);

  const err = providers.error || products.error || bundles.error || items.error || promotions.error;
  if (err) {
    if (isMissingTable(err)) return { status: "missing-table" as const, ...EMPTY_CATALOG };
    return { status: "error" as const, ...EMPTY_CATALOG };
  }

  const providerRows = (providers.data ?? []) as ProviderRow[];
  const productRows = ((products.data ?? []) as ProductRow[]).map((p) => ({
    ...p,
    provider: providerRows.find((x) => x.provider_id === p.provider_id) ?? null,
  }));
  const bundleRows = (bundles.data ?? []) as BundleRow[];
  const itemRows = ((items.data ?? []) as BundleItemRow[]).map((i) => ({
    ...i,
    product: productRows.find((p) => p.product_id === i.product_id) ?? null,
  }));
  const promotionRows = (promotions.data ?? []) as PromotionRow[];

  const benefits = bundleRows
    .filter((b) => b.is_active)
    .map((b) => bundleToBenefit(b, itemRows.filter((i) => i.bundle_id === b.bundle_id)));
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
  };
  } catch {
    return { status: "error" as const, ...EMPTY_CATALOG };
  }
}
