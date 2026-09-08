"use client";

import { Back, Gate, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function AlertSettings() {
  const { alerts, setAlerts } = useStore();
  const rows = [
    { key: "pay" as const, label: "결제 예정 알림" },
    { key: "renew" as const, label: "자동갱신 알림" },
    { key: "trial" as const, label: "무료체험 종료 알림" },
    { key: "benefit" as const, label: "혜택 알림" },
    { key: "marketing" as const, label: "마케팅 알림" },
  ];
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me" /><h1>알림 설정</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          <div className="menu">
            {rows.map((r) => (
              <button key={r.key} type="button" onClick={() => setAlerts({ [r.key]: !alerts[r.key] })}>
                {r.label}
                <span className={`switch ${alerts[r.key] ? "on" : ""}`}><i /></span>
              </button>
            ))}
          </div>
        </div>
      </PhoneShell>
    </Gate>
  );
}
