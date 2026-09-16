import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { sanitizeBundleIcon } from "@/lib/bundle-icon";
import { getSupabase } from "@/lib/supabase";

function logoOf(body: Record<string, unknown>) {
  try {
    return sanitizeBundleIcon(body.logo_url ?? body.icon);
  } catch (e) {
    return e instanceof Error ? e : new Error("아이콘을 저장하지 못했어요.");
  }
}

export async function GET() {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const res = await sb.from("provider").select("*").order("provider_id");
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: res.data });
}

export async function POST(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const body = await req.json() as Record<string, unknown>;
  const logo = logoOf(body);
  if (logo instanceof Error) return NextResponse.json({ ok: false, error: logo.message }, { status: 400 });
  const res = await sb.from("provider").insert({
    provider_name: String(body.provider_name ?? "").trim(),
    provider_type: String(body.provider_type ?? ""),
    logo_url: logo,
    official_url: String(body.official_url ?? ""),
    brand_color: String(body.brand_color ?? "#2576f2"),
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
  const logo = logoOf(body);
  if (logo instanceof Error) return NextResponse.json({ ok: false, error: logo.message }, { status: 400 });
  const id = Number(body.provider_id);
  const res = await sb.from("provider").update({
    provider_name: body.provider_name,
    provider_type: body.provider_type,
    logo_url: logo,
    official_url: body.official_url,
    brand_color: body.brand_color,
    is_active: body.is_active,
    updated_at: new Date().toISOString(),
  }).eq("provider_id", id).select("*").single();
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, row: res.data });
}

export async function DELETE(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "DB가 연결되어 있지 않아요." }, { status: 500 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const res = await sb.from("provider").delete().eq("provider_id", id);
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
