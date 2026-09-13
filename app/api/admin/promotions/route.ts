import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown>;
  const res = await sb.from("product_promotion").insert({
    product_id: body.product_id ? Number(body.product_id) : null,
    promotion_name: String(body.promotion_name ?? "").trim(),
    price_discount: body.price_discount == null ? null : Number(body.price_discount),
    discount_amount: body.discount_amount == null ? null : Number(body.discount_amount),
    apply_method: String(body.apply_method ?? ""),
    requirement: String(body.requirement ?? ""),
    start_at: body.start_at || null,
    end_at: body.end_at || null,
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
  const res = await sb.from("product_promotion").update({
    product_id: body.product_id ? Number(body.product_id) : null,
    promotion_name: body.promotion_name,
    price_discount: body.price_discount,
    discount_amount: body.discount_amount,
    apply_method: body.apply_method,
    requirement: body.requirement,
    start_at: body.start_at || null,
    end_at: body.end_at || null,
    is_active: body.is_active,
    updated_at: new Date().toISOString(),
  }).eq("promotion_id", Number(body.promotion_id)).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, row: res.data });
}

export async function DELETE(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const res = await sb.from("product_promotion").delete().eq("promotion_id", id);
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
