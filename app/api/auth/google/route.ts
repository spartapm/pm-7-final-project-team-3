import { NextResponse } from "next/server";
import { GOOGLE_CLIENT_ID, STATE_COOKIE, authOrigin, failLogin, randomState } from "@/lib/oauth";

export async function GET(req: Request) {
  const id = GOOGLE_CLIENT_ID;
  if (!id) return failLogin(req, "google-key");
  const state = randomState();
  const redirectUri = `${authOrigin(req)}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
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
