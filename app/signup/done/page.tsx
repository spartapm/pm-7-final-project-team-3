"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SignupDone() {
  const router = useRouter();
  const { hydrated, loggedIn, onboarded } = useStore();
  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) router.replace("/login");
    else if (onboarded) router.replace("/home");
  }, [hydrated, loggedIn, onboarded, router]);
  return (
    <PhoneShell>
      <div className="done-screen">
        <div className="check-mark">✓</div>
        <h1>가입이 완료됐어요</h1>
        <p>결제 전에 구독을 확인하고 관리할 수 있어요.</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/onboarding/alerts")}>
          시작하기
        </button>
      </div>
    </PhoneShell>
  );
}
