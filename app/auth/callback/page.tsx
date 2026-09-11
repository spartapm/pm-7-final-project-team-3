"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { hydrated, loggedIn, loginSocial, showToast } = useStore();
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    if (loggedIn) {
      router.replace("/home");
      return;
    }
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
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
  }, [hydrated, loggedIn, loginSocial, router, showToast]);

  return (
    <PhoneShell>
      <div className="splash">
        <img className="splash-logo" src="/brand/logo-slogan.png" alt="" />
        <p className="slogan">로그인하고 있어요</p>
      </div>
    </PhoneShell>
  );
}
