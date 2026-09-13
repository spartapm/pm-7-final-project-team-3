import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "teum_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "teum-admin";
}

export async function adminOk() {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(raw && raw === adminPassword());
}

export function deny() {
  return NextResponse.json({ ok: false, error: "권한이 없어요." }, { status: 401 });
}
