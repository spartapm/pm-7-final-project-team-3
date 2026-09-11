import { KAKAO_REST_API_KEY, authOrigin, failLogin, finishSocial, readOAuthState, socialEmail, tokenFailReason } from "@/lib/oauth";

export async function GET(req: Request) {
  const key = KAKAO_REST_API_KEY;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const saved = await readOAuthState(url.searchParams.get("state") ?? "");
  if (!code || !saved) return failLogin(req, "kakao-state");

  const redirectUri = saved.redirectUri || `${authOrigin(req)}/api/auth/kakao/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: key,
    redirect_uri: redirectUri,
    code,
  });
  const secret = process.env.KAKAO_CLIENT_SECRET;
  if (secret) body.set("client_secret", secret);

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  const token = await tokenRes.json() as { access_token?: string };
  if (!token.access_token) return failLogin(req, tokenFailReason("kakao", token));

  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json() as {
    id?: number;
    kakao_account?: { email?: string };
  };
  const email = socialEmail(me.kakao_account?.email ?? "", me.id, "k");
  if (!email) return failLogin(req, "kakao-email");
  return finishSocial(req, email, "kakao");
}
