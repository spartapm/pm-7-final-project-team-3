"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gate, PhoneShell } from "@/components/ui";
import { won } from "@/lib/format";

type Saved = { id: string; name: string; amount: number; cycle: string; alert: boolean };

export default function SavedSub() {
  const router = useRouter();
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("teum:last-sub");
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch { /* ignore */ }
  }, []);
  const cycle = saved?.cycle === "yearly" ? "1년" : saved?.cycle === "weekly" ? "1주" : "1개월";
  return (
    <Gate>
      <PhoneShell>
        <div className="done-screen">
          <img className="done-mascot" src="/teumki/joa.png" alt="" />
          <h1>구독이 저장됐어요</h1>
          {saved ? (
            <div className="card" style={{ textAlign: "left", margin: "16px 0 0" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{saved.name}</div>
              <p className="muted">{won(saved.amount)} · {cycle} · {saved.alert ? "알림 설정" : "알림 없음"}</p>
            </div>
          ) : null}
          <div style={{ height: 24 }} />
          <button
            className="btn primary"
            type="button"
            onClick={() => router.replace(saved?.id ? `/subscriptions/${saved.id}` : "/subscriptions")}
          >
            구독 상세 보기
          </button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
