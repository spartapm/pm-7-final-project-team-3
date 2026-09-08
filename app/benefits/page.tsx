"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fab, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BENEFITS, benefitStatus } from "@/lib/catalog";
import { daysUntil, won } from "@/lib/format";
import { leaksOf } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { BenefitKind } from "@/lib/types";

const KIND_FILTERS: { id: "all" | BenefitKind; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "carrier", label: "통신사 결합" },
  { id: "commerce", label: "커머스 멤버십" },
  { id: "card", label: "카드 혜택" },
];

const STATE_FILTERS: { id: "all" | "owned" | "available" | "expiring"; label: string }[] = [
  { id: "all", label: "모든 상태" },
  { id: "owned", label: "보유 혜택" },
  { id: "available", label: "사용 가능" },
  { id: "expiring", label: "만료 예정" },
];

const STATE_TAG: Record<"owned" | "available" | "expiring", { label: string; bg: string }> = {
  owned: { label: "보유 중", bg: "#2576f2" },
  available: { label: "사용 가능", bg: "#667085" },
  expiring: { label: "만료 예정", bg: "#ff7700" },
};

export default function BenefitsPage() {
  const router = useRouter();
  const { subscriptions } = useStore();
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]["id"]>("all");
  const [state, setState] = useState<(typeof STATE_FILTERS)[number]["id"]>("all");
  const leak = leaksOf(subscriptions);
  const list = BENEFITS.filter((b) => {
    if (kind !== "all" && b.kind !== kind) return false;
    const st = benefitStatus(b, subscriptions);
    if (state !== "all" && st !== state) return false;
    return true;
  });
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar left hero"><h1>혜택</h1></div>
        <div className="scroll tabbed">
          <div className="hero-dark">
            <div className="pillars" aria-hidden><i /><i /><i /></div>
            <h2>{leak.count > 0 ? `새는 구독 ${leak.count}개를 찾았어요` : "지금 혜택을 점검해 보세요"}</h2>
            <p>
              {leak.count > 0
                ? `지금 새는 구독료를 잠그면 매달 최대 ${won(Math.max(leak.save, 9900))}까지 절약할 수 있어요`
                : "통신사 결합과 멤버십에 이미 들어 있는 혜택이 있는지 확인해 보세요."}
            </p>
            <button className="btn" type="button" onClick={() => router.push("/inspect")}>구독 점검하기</button>
          </div>
          <div className="chip-row" style={{ margin: "14px 0 8px" }}>
            {KIND_FILTERS.map((f) => (
              <button key={f.id} className={`chip outline ${kind === f.id ? "on" : ""}`} type="button" onClick={() => setKind(f.id)}>{f.label}</button>
            ))}
          </div>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {STATE_FILTERS.map((f) => (
              <button key={f.id} className={`chip sm outline ${state === f.id ? "on" : ""}`} type="button" onClick={() => setState(f.id)}>{f.label}</button>
            ))}
          </div>
          <div className="section-title" style={{ marginTop: 4 }}>인기 구독 혜택</div>
          {list.length === 0 ? (
            <div className="empty">이 조건에 맞는 혜택이 없어요.</div>
          ) : list.map((b) => {
            const st = benefitStatus(b, subscriptions);
            const tag = STATE_TAG[st];
            return (
              <button key={b.id} className="benefit-card" type="button" onClick={() => router.push(`/benefits/${b.id}`)} style={{ width: "100%", textAlign: "left" }}>
                <span className="benefit-ico" aria-hidden>{b.icon}</span>
                <span className="body">
                  <span className="tag" style={{ background: b.providerColor }}>{b.provider}</span>
                  <span className="tag" style={{ background: tag.bg, marginLeft: 6 }}>{tag.label}</span>
                  <div style={{ fontWeight: 800, margin: "4px 0" }}>{b.title}</div>
                  <div className="muted">{b.body}</div>
                  {b.expires ? <div className="muted" style={{ marginTop: 6 }}>{daysUntil(b.expires) >= 0 ? `${daysUntil(b.expires)}일 뒤 만료` : "만료됨"}</div> : null}
                  <div className="muted" style={{ textAlign: "right", marginTop: 8 }}>자세히 보기 ›</div>
                </span>
              </button>
            );
          })}
        </div>
        <Fab />
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
