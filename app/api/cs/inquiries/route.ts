import { NextResponse } from "next/server";
import { rowToInquiry, sanitizeCsImages, validateInquiryInput } from "@/lib/cs";
import { uid } from "@/lib/format";
import { getSupabase, isMissingTable } from "@/lib/supabase";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId")?.trim() ?? "";
  if (!accountId) return fail("로그인이 필요해요.");
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const res = await sb.from("inquiry").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
  if (res.error) {
    if (isMissingTable(res.error)) return fail("문의 테이블이 아직 없어요.", 500);
    return fail(res.error.message, 500);
  }
  return NextResponse.json({ ok: true, inquiries: (res.data ?? []).map((row) => rowToInquiry(row as Record<string, unknown>)) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const accountId = String(body.accountId ?? "").trim();
  if (!accountId) return fail("로그인이 필요해요.");
  const err = validateInquiryInput({
    category: String(body.category ?? ""),
    title: String(body.title ?? ""),
    body: String(body.body ?? ""),
  });
  if (err) return fail(err);
  const images = sanitizeCsImages(body.images);
  if (images instanceof Error) return fail(images.message);
  const sb = getSupabase();
  if (!sb) return fail("DB가 연결되어 있지 않아요.", 500);
  const row = {
    id: uid("csq"),
    account_id: accountId,
    category: String(body.category).trim(),
    title: String(body.title).trim(),
    body: String(body.body).trim(),
    images,
    status: "WAITING",
    answer_body: "",
  };
  const res = await sb.from("inquiry").insert(row).select("*").single();
  if (res.error) {
    if (isMissingTable(res.error)) return fail("문의 테이블이 아직 없어요.", 500);
    return fail("문의를 등록하지 못했어요. 잠시 후 다시 시도해주세요.", 500);
  }
  return NextResponse.json({ ok: true, inquiry: rowToInquiry(res.data as Record<string, unknown>) });
}
