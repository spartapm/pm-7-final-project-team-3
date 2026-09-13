"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const go = (href: string) => {
    if (busy) return;
    setBusy(true);
    router.replace(href);
  };
  return (
    <PhoneShell>
      <div className="wait">
        <img className="teumki-illust" src="/teumki/sad.png" alt="" />
        <h2>정보를 불러오지 못했어요</h2>
        <p className="muted">없는 주소이거나 일시적인 오류예요.</p>
        <button className="btn primary" type="button" disabled={busy} onClick={() => go("/home")}>홈으로 가기</button>
        <div style={{ height: 8 }} />
        <button className="btn ghost" type="button" disabled={busy} onClick={() => go("/login")}>로그인으로</button>
      </div>
    </PhoneShell>
  );
}
