import { NextResponse } from "next/server";
import { adminOk, deny } from "@/lib/admin-auth";
import { loadAdminCategories } from "@/lib/admin-cats";
import type { CatalogCatKind } from "@/lib/catalog-cats";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function kindOf(raw: unknown): CatalogCatKind | null {
  return raw === "service" || raw === "benefit" ? raw : null;
}

export async function GET() {
  if (!(await adminOk())) return deny();
  try {
    const categories = await loadAdminCategories();
    return NextResponse.json({ ok: true, categories });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "카테고리를 불러오지 못했어요.", 500);
  }
}

export async function POST(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const body = await req.json().catch(() => ({})) as { kind?: string; name?: string; app_visible?: boolean };
  const kind = kindOf(body.kind);
  const name = String(body.name ?? "").trim();
  if (!kind) return fail("카테고리 종류를 선택해주세요.");
  if (!name) return fail("카테고리명을 입력해주세요.");
  if (name.length > 30) return fail("카테고리명은 30자까지 입력할 수 있어요.");
  const siblings = await sb.from("catalog_category").select("sort_order").eq("kind", kind);
  if (siblings.error && !isMissingTable(siblings.error)) return fail(siblings.error.message, 500);
  const sort = Math.max(0, ...((siblings.data ?? []) as { sort_order: number }[]).map((r) => Number(r.sort_order) || 0)) + 1;
  const res = await sb.from("catalog_category").insert({
    kind,
    name,
    sort_order: sort,
    app_visible: body.app_visible !== false,
  }).select("*").single();
  if (res.error) {
    if (isMissingTable(res.error)) return fail("카테고리 테이블이 아직 없어요. SQL을 적용해주세요.", 500);
    if (/unique|duplicate/i.test(res.error.message)) return fail("이미 있는 카테고리명이에요.");
    return fail(res.error.message, 400);
  }
  return NextResponse.json({ ok: true, row: res.data });
}

export async function PATCH(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const body = await req.json().catch(() => ({})) as {
    category_id?: number;
    name?: string;
    app_visible?: boolean;
    order?: number[];
    kind?: string;
  };

  if (Array.isArray(body.order) && body.order.length) {
    const kind = kindOf(body.kind);
    if (!kind) return fail("카테고리 종류를 선택해주세요.");
    for (let i = 0; i < body.order.length; i += 1) {
      const id = Number(body.order[i]);
      if (!Number.isInteger(id) || id <= 0) continue;
      const res = await sb.from("catalog_category").update({ sort_order: i }).eq("category_id", id).eq("kind", kind);
      if (res.error) return fail(res.error.message, 400);
    }
    return NextResponse.json({ ok: true });
  }

  const id = Number(body.category_id);
  if (!Number.isInteger(id) || id <= 0) return fail("카테고리를 찾을 수 없어요.");
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return fail("카테고리명을 입력해주세요.");
    if (name.length > 30) return fail("카테고리명은 30자까지 입력할 수 있어요.");
    patch.name = name;
  }
  if (typeof body.app_visible === "boolean") patch.app_visible = body.app_visible;
  if (!Object.keys(patch).length) return fail("변경할 내용이 없어요.");
  const res = await sb.from("catalog_category").update(patch).eq("category_id", id).select("*").single();
  if (res.error) {
    if (/unique|duplicate/i.test(res.error.message)) return fail("이미 있는 카테고리명이에요.");
    return fail(res.error.message, 400);
  }
  return NextResponse.json({ ok: true, row: res.data });
}

export async function DELETE(req: Request) {
  if (!(await adminOk())) return deny();
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("카테고리를 찾을 수 없어요.");
  const [pc, bc] = await Promise.all([
    sb.from("product_category").select("product_id").eq("category_id", id),
    sb.from("bundle_category").select("bundle_id").eq("category_id", id),
  ]);
  const linked = (pc.data?.length ?? 0) + (bc.data?.length ?? 0);
  if (linked > 0) return fail("연결된 상품이 있어 삭제할 수 없어요.");
  const res = await sb.from("catalog_category").delete().eq("category_id", id);
  if (res.error) return fail(res.error.message, 400);
  return NextResponse.json({ ok: true });
}
