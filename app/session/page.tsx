"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function SessionPage() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="wait">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>세션이 만료됐어요</h1>
        <p className="muted">다시 로그인하면 구독 관리를 이어갈 수 있어요.</p>
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            sessionStorage.removeItem("teum:session-expired");
            router.replace("/login");
          }}
        >
          로그인
        </button>
      </div>
    </PhoneShell>
  );
}
