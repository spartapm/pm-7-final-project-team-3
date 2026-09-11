import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SOCIAL_COOKIE } from "@/lib/oauth";

export async function GET() {
  const raw = (await cookies()).get(SOCIAL_COOKIE)?.value;
  if (!raw) return NextResponse.json({ email: null });
  try {
    const data = JSON.parse(raw) as { email?: string; provider?: string };
    if (!data.email) return NextResponse.json({ email: null });
    return NextResponse.json({ email: data.email, provider: data.provider ?? "" });
  } catch {
    return NextResponse.json({ email: null });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SOCIAL_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
