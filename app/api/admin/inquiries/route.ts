import { NextResponse } from "next/server";
import { adminOk } from "@/lib/admin-auth";
import { CS_CATEGORIES, isCsCategory, isCsStatus, maskEmail, rowToInquiry } from "@/lib/cs";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  if (!(await adminOk())) return fail("답변 권한이 없습니다", 401);
  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  let query = sb.from("inquiry").select("*").order("created_at", { ascending: false }).limit(200);
  if (isCsStatus(status)) query = query.eq("status", status);
  if (isCsCategory(category)) query = query.eq("category", category);
  if (q) query = query.ilike("title", `%${q}%`);
  const res = await query;
  if (res.error) {
    if (isMissingTable(res.error)) return fail("목록을 불러오지 못했습니다", 500);
    return fail("목록을 불러오지 못했습니다", 500);
  }
  const rows = res.data ?? [];
  const ids = [...new Set(rows.map((r) => String((r as { account_id: string }).account_id)))];
  const emails = new Map<string, string>();
  if (ids.length) {
    const acc = await sb.from("accounts").select("id, email").in("id", ids);
    for (const a of acc.data ?? []) emails.set(String(a.id), String(a.email ?? ""));
  }
  const waitingRes = await sb.from("inquiry").select("id", { count: "exact", head: true }).eq("status", "WAITING");
  return NextResponse.json({
    ok: true,
    waiting: waitingRes.count ?? rows.filter((r) => String((r as { status: string }).status) === "WAITING").length,
    categories: CS_CATEGORIES,
    inquiries: rows.map((row) => {
      const rec = row as Record<string, unknown>;
      const email = emails.get(String(rec.account_id)) ?? "";
      return rowToInquiry(rec, email ? maskEmail(email) : "");
    }),
  });
}
