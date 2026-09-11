import { NextResponse } from "next/server";
import { KAKAO_REST_API_KEY, STATE_COOKIE, authOrigin, failLogin, randomState } from "@/lib/oauth";

export async function GET(req: Request) {
  const key = KAKAO_REST_API_KEY;
  const state = randomState();
  const redirectUri = `${authOrigin(req)}/api/auth/kakao/callback`;
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", key);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "account_email profile_nickname");
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: authOrigin(req).startsWith("https"),
  });
  return res;
}
