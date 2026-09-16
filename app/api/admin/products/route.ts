import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { sanitizeBundleIcon } from "@/lib/bundle-icon";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function iconOf(body: Record<string, unknown>) {
  try {
    return sanitizeBundleIcon(body.icon);
  } catch (e) {
    return e instanceof Error ? e : new Error("아이콘을 저장하지 못했어요.");
  }
}

function planRowsOf(body: Record<string, unknown>) {
  const raw = Array.isArray(body.plans) ? body.plans : [];
  return raw.map((row, i) => {
    const r = row as Record<string, unknown>;
    return {
      plan_name: String(r.plan_name ?? "").trim(),
      price_standard: Number(r.price_standard ?? 0) || 0,
      sort_order: i,
    };
  }).filter((p) => p.plan_name || p.price_standard);
}

function productPayload(body: Record<string, unknown>, icon: string) {
  const plans = planRowsOf(body);
  const price = plans[0]?.price_standard ?? (Number(body.price_standard ?? 0) || 0);
  return {
    provider_id: body.provider_id ? Number(body.provider_id) : null,
    product_name: String(body.product_name ?? "").trim(),
    product_name_en: String(body.product_name_en ?? "").trim(),
    category: String(body.category ?? ""),
    product_type: String(body.product_type ?? "단독"),
    price_standard: price,
    icon,
    official_url: String(body.official_url ?? ""),
    is_active: body.is_active !== false,
  };
}

async function replacePlans(productId: number, body: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  const rows = planRowsOf(body).map((p) => ({ ...p, product_id: productId }));
  const del = await sb.from("product_plan").delete().eq("product_id", productId);
  if (del.error) {
    if (isMissingTable(del.error)) return;
    throw new Error(del.error.message);
  }
  if (rows.length === 0) return;
  const ins = await sb.from("product_plan").insert(rows);
  if (ins.error) {
    if (isMissingTable(ins.error)) return;
    throw new Error(ins.error.message);
  }
}

async function writeProduct(kind: "insert" | "update", body: Record<string, unknown>, icon: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("DB가 연결되어 있지 않아요.");
  const full = productPayload(body, icon);
  const { product_name_en: nameEn, ...base } = full;
  const run = async (payload: Record<string, unknown>) => kind === "insert"
    ? sb.from("product").insert(payload).select("*").single()
    : sb.from("product").update({ ...payload, updated_at: new Date().toISOString() }).eq("product_id", Number(body.product_id)).select("*").single();
  let res = await run({ ...base, product_name_en: nameEn });
  if (res.error && /product_name_en|schema cache|column/i.test(res.error.message)) {
    res = await run(base);
  }
  if (res.error) throw new Error(res.error.message);
  const id = Number((res.data as { product_id: number }).product_id);
  await replacePlans(id, body);
  return res.data;
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
  const body = await req.json() as Record<string, unknown>;
  const icon = iconOf(body);
  if (icon instanceof Error) return NextResponse.json({ ok: false, error: icon.message }, { status: 400 });
  try {
    const row = await writeProduct("insert", body, icon);
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "저장 실패" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  if (!(await adminOk())) return deny();
  const body = await req.json() as Record<string, unknown>;
  const icon = iconOf(body);
  if (icon instanceof Error) return NextResponse.json({ ok: false, error: icon.message }, { status: 400 });
  try {
    const row = await writeProduct("update", body, icon);
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "저장 실패" }, { status: 400 });
  }
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
