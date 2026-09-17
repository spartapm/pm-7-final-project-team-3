"use client";

import { useEffect, useRef } from "react";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID || "G-1YZTY70NF3";

export type GaValue = string | number | boolean;
export type GaParams = Record<string, GaValue | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const NAV_KEY = "teum:ga-nav";
const LOGIN_METHOD_KEY = "teum:ga-login-method";
const INSPECT_AT_KEY = "teum:ga-inspect-at";
const INSPECT_SRC_KEY = "teum:ga-inspect-source";

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function stub() {
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag(...args);
}

export function track(event: string, params: GaParams = {}) {
  if (typeof window === "undefined") return;
  const payload: Record<string, GaValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") payload[key] = value;
  }
  gtag("event", event, payload);
}

export function markNavSource() {
  try { sessionStorage.setItem(NAV_KEY, "1"); } catch { /* ignore */ }
}

export function consumeViewSource(): GaParams {
  try {
    if (sessionStorage.getItem(NAV_KEY) === "1") {
      sessionStorage.removeItem(NAV_KEY);
      return { source: "navigation" };
    }
  } catch { /* ignore */ }
  return {};
}

export function rememberLoginMethod(method: "google" | "kakao") {
  try { sessionStorage.setItem(LOGIN_METHOD_KEY, method); } catch { /* ignore */ }
}

export function consumeLoginMethod(): "google" | "kakao" | "email" {
  try {
    const v = sessionStorage.getItem(LOGIN_METHOD_KEY);
    sessionStorage.removeItem(LOGIN_METHOD_KEY);
    if (v === "google" || v === "kakao") return v;
  } catch { /* ignore */ }
  return "email";
}

export function markInspectStart(source: string) {
  try {
    sessionStorage.setItem(INSPECT_AT_KEY, String(Date.now()));
    sessionStorage.setItem(INSPECT_SRC_KEY, source);
  } catch { /* ignore */ }
}

export function inspectMeta() {
  try {
    const at = Number(sessionStorage.getItem(INSPECT_AT_KEY) || 0);
    const source = sessionStorage.getItem(INSPECT_SRC_KEY) || undefined;
    return {
      source,
      processing_time_ms: at ? Math.max(0, Date.now() - at) : undefined,
    };
  } catch {
    return {};
  }
}

export function bumpRetry(key: string) {
  if (typeof window === "undefined") return 0;
  const full = `teum:ga-retry:${key}`;
  const n = Number(sessionStorage.getItem(full) || 0) + 1;
  sessionStorage.setItem(full, String(n));
  return n;
}

export function readRetry(key: string) {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(`teum:ga-retry:${key}`) || 0);
}

export function retryGroup(n: number) {
  if (n <= 0) return "0";
  if (n === 1) return "1";
  return "2+";
}

export function countGroup(n: number) {
  if (n <= 1) return "1";
  if (n === 2) return "2";
  return "3+";
}

export function fabSource(path: string) {
  const p = String(path || "");
  if (p.startsWith("/calendar")) return "calendar";
  if (p.startsWith("/subscriptions")) return "subscription_list";
  return "home";
}

export function deleteReasonType(label: string) {
  if (label.includes("안 써")) return "unused";
  if (label.includes("개인정보")) return "privacy";
  if (label.includes("다른 서비스")) return "switch";
  if (label.includes("오류")) return "error";
  if (label.includes("방문")) return "low_visit";
  return "other";
}

export function useGaView(event: string, params: GaParams = {}, ready = true) {
  const sent = useRef(false);
  useEffect(() => {
    if (!ready || sent.current) return;
    sent.current = true;
    track(event, { ...consumeViewSource(), ...params });
  }, [event, ready]);
}
