import { NextResponse } from "next/server";
import { unlinkKakao } from "@/lib/oauth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { kakaoId?: string };
  const ok = await unlinkKakao(String(body.kakaoId ?? ""));
  return NextResponse.json({ ok });
}
