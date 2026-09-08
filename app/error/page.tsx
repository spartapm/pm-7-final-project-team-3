"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function ErrorPage() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="wait">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>화면을 불러오지 못했어요</h1>
        <p className="muted">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
        <button className="btn primary" type="button" onClick={() => router.replace("/home")}>다시 시도</button>
      </div>
    </PhoneShell>
  );
}
