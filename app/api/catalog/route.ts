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
  });
}
