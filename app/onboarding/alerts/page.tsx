"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function OnboardAlerts() {
  const router = useRouter();
  const { setOnboarded, setAlerts, hydrated, loggedIn, onboarded } = useStore();
  const [pay, setPay] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) router.replace("/login");
    else if (onboarded) router.replace("/home");
  }, [hydrated, loggedIn, onboarded, router]);
  return (
    <PhoneShell>
      <div className="auth">
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 48 }}>결제 전에 알려 드릴까요?</h1>
        <p className="muted" style={{ margin: "10px 0 24px", lineHeight: 1.5 }}>
          무료체험 종료, 자동갱신, 결제 예정일을 놓치지 않도록 사전 알림을 받을 수 있어요. 나중에 마이페이지에서 바꿀 수 있습니다.
        </p>
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 800 }}>결제·체험 종료 알림</div>
            <div className="muted">결제 예정, 자동갱신, 무료체험 종료</div>
          </div>
          <button className={`switch ${pay ? "on" : ""}`} type="button" onClick={() => setPay((v) => !v)} aria-label="결제 알림">
            <i />
          </button>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800 }}>마케팅·혜택 알림</div>
            <div className="muted">친구 초대 쿠폰, 결합 혜택 안내</div>
          </div>
          <button className={`switch ${marketing ? "on" : ""}`} type="button" onClick={() => setMarketing((v) => !v)} aria-label="마케팅 알림">
            <i />
          </button>
        </div>
        <div style={{ height: 24 }} />
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            setAlerts({ pay, renew: pay, trial: pay, marketing, benefit: marketing, calendar: true });
            setOnboarded(marketing);
            router.replace("/home");
          }}
        >
          홈으로 가기
        </button>
      </div>
    </PhoneShell>
  );
}
