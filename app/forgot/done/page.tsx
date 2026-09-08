"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function PwDone() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="done-screen">
        <div className="check-mark">✓</div>
        <h1>비밀번호가 재설정됐어요</h1>
        <p>새 비밀번호로 로그인해 주세요.</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/login")}>
          로그인 하러 가기
        </button>
      </div>
    </PhoneShell>
  );
}
