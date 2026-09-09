"use client";

import { useRouter } from "next/navigation";
import { Gate, PhoneShell } from "@/components/ui";

export default function EventSaved() {
  const router = useRouter();
  return (
    <Gate>
    <PhoneShell>
      <div className="done-screen">
        <img className="done-mascot" src="/teumki/joa.png" alt="" />
        <h1>일정이 저장됐어요</h1>
        <p>캘린더에서 구독·일상을 함께 확인할 수 있어요.</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/calendar")}>캘린더에서 보기</button>
      </div>
    </PhoneShell>
    </Gate>
  );
}
