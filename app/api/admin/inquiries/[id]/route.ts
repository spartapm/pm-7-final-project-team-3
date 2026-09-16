import { NextResponse } from "next/server";
import { adminOk } from "@/lib/admin-auth";
import { csNoticeId, isCsStatus, maskEmail, rowToInquiry } from "@/lib/cs";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function emailsOf(sb: NonNullable<ReturnType<typeof getSupabase>>, ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const acc = await sb.from("accounts").select("id, email").in("id", ids);
  for (const a of acc.data ?? []) map.set(String(a.id), String(a.email ?? ""));
  return map;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await adminOk())) return fail("답변 권한이 없습니다", 401);
  const { id } = await ctx.params;
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const res = await sb.from("inquiry").select("*").eq("id", id).maybeSingle();
  if (res.error) {
    if (isMissingTable(res.error)) return fail("문의를 불러오지 못했습니다.", 500);
    return fail(res.error.message, 500);
  }
  if (!res.data) return fail("문의를 찾을 수 없습니다.", 404);
  const row = res.data as Record<string, unknown>;
  const accountId = String(row.account_id);
  const othersRes = await sb.from("inquiry").select("*").eq("account_id", accountId).neq("id", id).order("created_at", { ascending: false }).limit(5);
  const emails = await emailsOf(sb, [accountId]);
  const email = emails.get(accountId) ?? "";
  return NextResponse.json({
    ok: true,
    inquiry: rowToInquiry(row, email ? maskEmail(email) : ""),
    others: (othersRes.data ?? []).map((r) => rowToInquiry(r as Record<string, unknown>)),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await adminOk())) return fail("답변 권한이 없습니다", 401);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { answer_body?: string; close?: boolean };
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const cur = await sb.from("inquiry").select("*").eq("id", id).maybeSingle();
  if (cur.error) return fail(cur.error.message, 500);
  if (!cur.data) return fail("문의를 찾을 수 없습니다.", 404);
  const row = cur.data as Record<string, unknown>;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  const firstAnswer = !row.answered_at;

  if (body.close) {
    patch.status = "CLOSED";
    patch.closed_at = now;
  }

  if (typeof body.answer_body === "string") {
    const text = body.answer_body.trim();
    if (text.length < 10) return fail("답변은 10자 이상 입력해주세요.");
    if (text.length > 2000) return fail("답변은 2000자까지 입력할 수 있어요.");
    patch.answer_body = text;
    if (firstAnswer) {
      patch.answered_at = now;
      if (!body.close) patch.status = "ANSWERED";
    } else if (!body.close && isCsStatus(String(row.status)) && String(row.status) === "WAITING") {
      patch.status = "ANSWERED";
    }
  }

  if (!Object.keys(patch).length) return fail("변경할 내용이 없어요.");
  const saved = await sb.from("inquiry").update(patch).eq("id", id).select("*").single();
  if (saved.error) return fail(saved.error.message, 500);

  if (typeof body.answer_body === "string" && firstAnswer) {
    const notice = await sb.from("notices").upsert({
      id: csNoticeId(id),
      account_id: String(row.account_id),
      title: "문의하신 내용에 답변이 도착했어요",
      body: String(row.title ?? ""),
      at: now,
      read: false,
      href: `/me/cs/${id}`,
      icon: "gift",
      brand: "틈",
    }, { onConflict: "id" });
    if (notice.error) {
      console.error("[teum] cs notice", notice.error.message);
    }
  }

  const emails = await emailsOf(sb, [String(row.account_id)]);
  const email = emails.get(String(row.account_id)) ?? "";
  return NextResponse.json({
    ok: true,
    inquiry: rowToInquiry(saved.data as Record<string, unknown>, email ? maskEmail(email) : ""),
  });
}
