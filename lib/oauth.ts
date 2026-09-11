import { NextResponse } from "next/server";

export const STATE_COOKIE = "teum_oauth_state";
export const SOCIAL_COOKIE = "teum_social";

export const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY ?? "";
export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

export function authOrigin(req: Request) {
  const forced = process.env.AUTH_BASE_URL?.replace(/\/$/, "");
  if (forced) return forced;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3003";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function randomState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function failLogin(req: Request, reason: string) {
  const url = new URL("/login", authOrigin(req));
  url.searchParams.set("social", "fail");
  url.searchParams.set("why", reason);
  return NextResponse.redirect(url);
}

export function finishSocial(req: Request, email: string, provider: "kakao" | "google") {
  const url = new URL("/auth/callback", authOrigin(req));
  const res = NextResponse.redirect(url);
  res.cookies.set(SOCIAL_COOKIE, JSON.stringify({ email, provider }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
    secure: authOrigin(req).startsWith("https"),
  });
  res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
