"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

function AuthCallbackInner() {
  const router = useRouter();
  const q = useSearchParams();
  const { hydrated, loggedIn, loginSocial, showToast } = useStore();
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    if (loggedIn) {
      router.replace("/home");
      return;
    }
    started.current = true;
    const ticket = q.get("ticket") ?? "";
    (async () => {
      try {
        const res = await fetch(ticket ? `/api/auth/session?ticket=${encodeURIComponent(ticket)}` : "/api/auth/session");
        const json = await res.json() as { email?: string | null };
        if (!json.email) {
          showToast("소셜 로그인에 실패했어요. 다시 시도해주세요.", "err");
          router.replace("/login?social=fail");
          return;
        }
        const out = await loginSocial(json.email);
        await fetch("/api/auth/session", { method: "DELETE" });
        if (!out.ok) {
          showToast(out.error ?? "소셜 로그인에 실패했어요. 다시 시도해주세요.", "err");
          router.replace("/login?social=fail");
          return;
        }
        router.replace("/home");
      } catch {
        showToast("소셜 로그인에 실패했어요. 다시 시도해주세요.", "err");
        router.replace("/login?social=fail");
      }
    })();
  }, [hydrated, loggedIn, loginSocial, q, router, showToast]);

  return (
    <PhoneShell>
      <div className="splash">
        <img className="splash-logo" src="/brand/logo-slogan.png" alt="" />
        <p className="slogan">로그인하고 있어요</p>
      </div>
    </PhoneShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <PhoneShell>
        <div className="splash">
          <img className="splash-logo" src="/brand/logo-slogan.png" alt="" />
          <p className="slogan">로그인하고 있어요</p>
        </div>
      </PhoneShell>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
