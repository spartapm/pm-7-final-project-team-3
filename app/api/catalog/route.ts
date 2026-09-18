import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog-db";

export async function GET() {
  const data = await loadCatalog();
  return NextResponse.json({
    ok: data.status === "ok" || data.status === "off",
    source: data.status === "ok" && data.benefits.length ? "db" : "code",
    status: data.status,
    benefits: data.benefits,
    providers: data.providers,
    products: data.products,
    bundles: data.bundles,
    items: data.items,
    promotions: data.promotions,
    bundleProducts: data.bundleProducts,
    categories: data.categories,
    benefitFilters: data.benefitFilters,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
