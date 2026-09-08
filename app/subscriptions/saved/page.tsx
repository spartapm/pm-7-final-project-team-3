"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function SavedSub() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="done-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <h1>구독 정보가 저장됐어요</h1>
        <p>홈과 캘린더에서 다음 결제를 확인할 수 있어요.</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/subscriptions")}>내 구독 보기</button>
        <div style={{ height: 8 }} />
        <button className="btn ghost" type="button" onClick={() => router.replace("/calendar")}>캘린더에서 보기</button>
      </div>
    </PhoneShell>
  );
}
