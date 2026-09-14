import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { sanitizeBundleIcon } from "@/lib/bundle-icon";
import { getSupabase } from "@/lib/supabase";

function iconOf(body: Record<string, unknown>) {
  try {
    return sanitizeBundleIcon(body.icon);
  } catch (e) {
    return e instanceof Error ? e : new Error("아이콘을 저장하지 못했어요.");
  }
}

export async function GET() {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const res = await sb.from("product").select("*").order("product_id");
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: res.data });
}

export async function POST(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown>;
  const icon = iconOf(body);
  if (icon instanceof Error) return NextResponse.json({ ok: false, error: icon.message }, { status: 400 });
  const res = await sb.from("product").insert({
    provider_id: body.provider_id ? Number(body.provider_id) : null,
    product_name: String(body.product_name ?? "").trim(),
    category: String(body.category ?? ""),
    product_type: String(body.product_type ?? "단독"),
    price_standard: Number(body.price_standard ?? 0) || 0,
    icon,
    official_url: String(body.official_url ?? ""),
    is_active: body.is_active !== false,
  }).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, row: res.data });
}

export async function PATCH(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown>;
  const id = Number(body.product_id);
  const icon = iconOf(body);
  if (icon instanceof Error) return NextResponse.json({ ok: false, error: icon.message }, { status: 400 });
  const res = await sb.from("product").update({
    provider_id: body.provider_id ? Number(body.provider_id) : null,
    product_name: body.product_name,
    category: body.category,
    product_type: body.product_type,
    price_standard: body.price_standard,
    icon,
    official_url: body.official_url,
    is_active: body.is_active,
    updated_at: new Date().toISOString(),
  }).eq("product_id", id).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, row: res.data });
}

export async function DELETE(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const res = await sb.from("product").delete().eq("product_id", id);
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
