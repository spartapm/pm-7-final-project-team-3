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

function oauthSecret() {
  return process.env.AUTH_SECRET || KAKAO_REST_API_KEY || GOOGLE_CLIENT_SECRET || "teum-oauth";
}

function b64urlEncode(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(text: string) {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function b64urlBytes(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let bin = "";
  arr.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signBody(body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(oauthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${b64urlEncode(body)}.${b64urlBytes(sig)}`;
}

async function readSigned<T>(token: string): Promise<T | null> {
  const cut = token.lastIndexOf(".");
  if (cut < 1) return null;
  const body = token.slice(0, cut);
  const sig = token.slice(cut + 1);
  const expected = await signBody(b64urlDecode(body));
  if (expected.split(".")[1] !== sig) return null;
  try {
    return JSON.parse(b64urlDecode(body)) as T;
  } catch {
    return null;
  }
}

export async function makeOAuthState(redirectUri: string) {
  return signBody(JSON.stringify({
    r: redirectUri,
    e: Date.now() + 10 * 60 * 1000,
  }));
}

export async function readOAuthState(state: string) {
  const data = await readSigned<{ r?: string; e?: number }>(state);
  if (!data?.r || !data.e || data.e < Date.now()) return null;
  return { redirectUri: data.r };
}

export async function makeSocialTicket(email: string, provider: "kakao" | "google") {
  return signBody(JSON.stringify({
    email,
    provider,
    e: Date.now() + 3 * 60 * 1000,
  }));
}

export async function readSocialTicket(token: string) {
  const data = await readSigned<{ email?: string; provider?: string; e?: number }>(token);
  if (!data?.email || !data.e || data.e < Date.now()) return null;
  return { email: data.email, provider: data.provider ?? "" };
}

export function socialEmail(raw: string, fallbackId: string | number | undefined, prefix: "k" | "g") {
  const fromProvider = raw.trim().toLowerCase();
  if (fromProvider && fromProvider.length >= 10 && fromProvider.length <= 30) return fromProvider;
  const id = String(fallbackId ?? "").replace(/\D/g, "").slice(-10);
  return id ? `${prefix}${id}@teum.app` : "";
}

export function failLogin(req: Request, reason: string) {
  const url = new URL("/login", authOrigin(req));
  url.searchParams.set("social", "fail");
  url.searchParams.set("why", reason);
  return NextResponse.redirect(url);
}

export async function finishSocial(req: Request, email: string, provider: "kakao" | "google") {
  const ticket = await makeSocialTicket(email, provider);
  const url = new URL("/auth/callback", authOrigin(req));
  url.searchParams.set("ticket", ticket);
  return NextResponse.redirect(url);
}

export function tokenFailReason(provider: "kakao" | "google", raw: unknown) {
  const text = JSON.stringify(raw ?? {});
  if (/invalid_client|client_secret|KOE010/i.test(text)) return `${provider}-secret`;
  return `${provider}-token`;
}
