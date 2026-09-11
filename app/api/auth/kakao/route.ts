import { NextResponse } from "next/server";
import { KAKAO_REST_API_KEY, authOrigin, failLogin, makeOAuthState } from "@/lib/oauth";

export async function GET(req: Request) {
  const key = KAKAO_REST_API_KEY;
  if (!key) return failLogin(req, "kakao-key");
  const redirectUri = `${authOrigin(req)}/api/auth/kakao/callback`;
  const state = await makeOAuthState(redirectUri);
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", key);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
