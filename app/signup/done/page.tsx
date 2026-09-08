"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function SignupDone() {
  const router = useRouter();
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
