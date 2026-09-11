import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STATE_COOKIE, authOrigin, failLogin, finishSocial, readCookie, unpackOAuthStart } from "@/lib/oauth";

export async function GET(req: Request) {
  const id = GOOGLE_CLIENT_ID;
  const secret = GOOGLE_CLIENT_SECRET;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = unpackOAuthStart(readCookie(req, STATE_COOKIE));
  if (!code || !state || !saved || state !== saved.state) return failLogin(req, "google-state");

  const redirectUri = saved.redirectUri || `${authOrigin(req)}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenRes.json() as { access_token?: string };
  if (!token.access_token) return failLogin(req, "google-token");

  const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json() as { email?: string; id?: string };
  const fromGoogle = me.email?.trim().toLowerCase() ?? "";
  const fallback = me.id ? `g${String(me.id).slice(-12)}@teum.app` : "";
  const email = (fromGoogle && fromGoogle.length <= 30 ? fromGoogle : "") || fallback;
  if (!email) return failLogin(req, "google-email");
  return finishSocial(req, email, "google");
}
