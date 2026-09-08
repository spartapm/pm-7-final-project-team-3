"use client";

import { useRouter } from "next/navigation";
import { Gate, PhoneShell } from "@/components/ui";

export default function EventSaved() {
  const router = useRouter();
  return (
    <Gate>
    <PhoneShell>
      <div className="done-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <h1>일정이 저장됐어요</h1>
        <p>캘린더 필터에서 일상 일정만 따로 볼 수 있어요.</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/calendar")}>캘린더에서 보기</button>
      </div>
    </PhoneShell>
    </Gate>
  );
}
