import { NextResponse } from "next/server";
import { canDeleteInquiry, rowToInquiry } from "@/lib/cs";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function loadOwned(id: string, accountId: string) {
  const sb = getSupabase();
  if (!sb) return { error: fail("DB가 연결되어 있지 않아요.", 500) };
  const res = await sb.from("inquiry").select("*").eq("id", id).maybeSingle();
  if (res.error) {
    if (isMissingTable(res.error)) return { error: fail("문의 테이블이 아직 없어요.", 500) };
    return { error: fail(res.error.message, 500) };
  }
  if (!res.data) return { error: fail("삭제된 문의예요", 404) };
  if (String((res.data as { account_id: string }).account_id) !== accountId) return { error: fail("삭제된 문의예요", 404) };
  return { sb, row: res.data as Record<string, unknown> };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const accountId = new URL(req.url).searchParams.get("accountId")?.trim() ?? "";
  if (!accountId) return fail("로그인이 필요해요.");
  const loaded = await loadOwned(id, accountId);
  if ("error" in loaded && loaded.error) return loaded.error;
  return NextResponse.json({ ok: true, inquiry: rowToInquiry(loaded.row) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { accountId?: string; read?: boolean };
  const accountId = String(body.accountId ?? "").trim();
  if (!accountId) return fail("로그인이 필요해요.");
  const loaded = await loadOwned(id, accountId);
  if ("error" in loaded && loaded.error) return loaded.error;
  if (!body.read) return NextResponse.json({ ok: true, inquiry: rowToInquiry(loaded.row) });
  const now = new Date().toISOString();
  const res = await loaded.sb.from("inquiry").update({ read_at: loaded.row.read_at ?? now }).eq("id", id).select("*").single();
  if (res.error) return fail(res.error.message, 500);
  return NextResponse.json({ ok: true, inquiry: rowToInquiry(res.data as Record<string, unknown>) });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const accountId = new URL(req.url).searchParams.get("accountId")?.trim()
    || String((await req.json().catch(() => ({})) as { accountId?: string }).accountId ?? "").trim();
  if (!accountId) return fail("로그인이 필요해요.");
  const loaded = await loadOwned(id, accountId);
  if ("error" in loaded && loaded.error) return loaded.error;
  if (String(loaded.row.status) !== "WAITING") return fail("답변 대기 중인 문의만 삭제할 수 있어요.");
  if (!canDeleteInquiry(String(loaded.row.created_at ?? ""))) return fail("등록 후 10분이 지나 삭제할 수 없어요.");
  const del = await loaded.sb.from("inquiry").delete().eq("id", id);
  if (del.error) return fail(del.error.message, 500);
  await loaded.sb.from("notices").delete().eq("id", `cs_${id}`);
  return NextResponse.json({ ok: true });
}
