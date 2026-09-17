import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { categoryIdsOf, loadAdminCategories, replaceCategoryMaps } from "@/lib/admin-cats";
import { sanitizeBundleIcon } from "@/lib/bundle-icon";
import { getSupabase } from "@/lib/supabase";

type ItemIn = { product_id: number; item_role: string; required?: boolean };

async function replaceItems(bundleId: number, items: ItemIn[]) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("bundle_item").delete().eq("bundle_id", bundleId);
  if (!items.length) return;
  await sb.from("bundle_item").insert(items.map((i) => ({
    bundle_id: bundleId,
    product_id: Number(i.product_id),
    item_role: i.item_role || "PRIMARY",
    required: i.required !== false,
  })));
}

export async function POST(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown> & { items?: ItemIn[] };
  let icon = "";
  try { icon = sanitizeBundleIcon(body.icon); } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "아이콘을 저장하지 못했어요." }, { status: 400 });
  }
  const cats = await loadAdminCategories();
  const mapped = categoryIdsOf(body, cats);
  const res = await sb.from("bundle_product").insert({
    bundle_name: String(body.bundle_name ?? "").trim(),
    category: mapped.category,
    card_title: String(body.card_title ?? ""),
    card_body: String(body.card_body ?? ""),
    icon,
    price_bundled: Number(body.price_bundled ?? 0) || 0,
    apply_method: String(body.apply_method ?? ""),
    requirement: String(body.requirement ?? ""),
    official_url: String(body.official_url ?? ""),
    expires: body.expires ? String(body.expires) : null,
    is_active: body.is_active !== false,
  }).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  await replaceItems(res.data.bundle_id, body.items ?? []);
  await replaceCategoryMaps("bundle", res.data.bundle_id, mapped.allIds);
  return NextResponse.json({ ok: true, row: res.data });
}

export async function PATCH(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown> & { items?: ItemIn[] };
  const id = Number(body.bundle_id);
  let icon: string;
  try { icon = sanitizeBundleIcon(body.icon); } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "아이콘을 저장하지 못했어요." }, { status: 400 });
  }
  const cats = await loadAdminCategories();
  const mapped = categoryIdsOf(body, cats);
  const res = await sb.from("bundle_product").update({
    bundle_name: body.bundle_name,
    category: mapped.category,
    card_title: body.card_title,
    card_body: body.card_body,
    icon,
    price_bundled: body.price_bundled,
    apply_method: body.apply_method,
    requirement: body.requirement,
    official_url: body.official_url,
    expires: body.expires ? body.expires : null,
    is_active: body.is_active,
    updated_at: new Date().toISOString(),
  }).eq("bundle_id", id).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  if (body.items) await replaceItems(id, body.items);
  await replaceCategoryMaps("bundle", id, mapped.allIds);
  return NextResponse.json({ ok: true, row: res.data });
}

export async function DELETE(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const res = await sb.from("bundle_product").delete().eq("bundle_id", id);
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
