import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminOk, adminPassword, deny } from "@/lib/admin-auth";
import { loadCatalog } from "@/lib/catalog-db";

export async function GET() {
  if (!(await adminOk())) return deny();
  const data = await loadCatalog();
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { password?: string };
  if (!body.password || body.password !== adminPassword()) {
    return NextResponse.json({ ok: false, error: "비밀번호가 올바르지 않아요." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminPassword(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
