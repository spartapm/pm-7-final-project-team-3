import { cookies } from "next/headers";
import { KAKAO_REST_API_KEY, STATE_COOKIE, authOrigin, failLogin, finishSocial } from "@/lib/oauth";

export async function GET(req: Request) {
  const key = KAKAO_REST_API_KEY;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get(STATE_COOKIE)?.value;
  if (!code || !state || !saved || state !== saved) return failLogin(req, "kakao-state");

  const redirectUri = `${authOrigin(req)}/api/auth/kakao/callback`;
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: key,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const token = await tokenRes.json() as { access_token?: string };
  if (!token.access_token) return failLogin(req, "kakao-token");

  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json() as {
    id?: number;
    kakao_account?: { email?: string; is_email_valid?: boolean; is_email_verified?: boolean };
  };
  const email = me.kakao_account?.email?.trim().toLowerCase()
    || (me.id ? `k${me.id}@kakao.teum.app` : "");
  if (!email) return failLogin(req, "kakao-email");
  return finishSocial(req, email, "kakao");
}
