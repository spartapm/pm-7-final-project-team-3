import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog-db";
import { BENEFITS } from "@/lib/catalog";

export async function GET() {
  const data = await loadCatalog();
  const benefits = data.benefits.length ? data.benefits : BENEFITS;
  return NextResponse.json({
    ok: data.status === "ok" || data.status === "off",
    source: data.benefits.length ? "db" : "code",
    status: data.status,
    benefits,
    providers: data.providers,
    products: data.products,
    bundles: data.bundles,
    items: data.items,
    promotions: data.promotions,
    bundleProducts: data.bundleProducts,
  });
}
