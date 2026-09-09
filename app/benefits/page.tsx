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

const KIND_ORDER: Record<BenefitKind, number> = { carrier: 0, commerce: 1, card: 2 };

const STATE_TAG: Record<"owned" | "available" | "expiring", { label: string; bg: string }> = {
  owned: { label: "보유 중", bg: "#2576f2" },
  available: { label: "사용 가능", bg: "#667085" },
  expiring: { label: "만료 예정", bg: "#ff7700" },
};

export default function BenefitsPage() {
  const router = useRouter();
  const { subscriptions } = useStore();
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]["id"]>("all");
  const leak = leaksOf(subscriptions);
  const kindLabel = KIND_FILTERS.find((f) => f.id === kind)?.label ?? "전체";
  const list = BENEFITS
    .filter((b) => !b.expires || daysUntil(b.expires) >= 0)
    .filter((b) => kind === "all" || b.kind === kind)
    .slice()
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar left hero"><h1>혜택</h1></div>
        <div className="scroll tabbed">
          <div className="hero-dark">
            <div className="pillars" aria-hidden><i /><i /><i /></div>
            {leak.count > 0 ? (
              <>
                <h2>새는 구독 {leak.count}개를 찾았어요</h2>
                <p>지금 새는 구독비를 잠그면 매달 최대 {won(Math.max(leak.save, 9900))}까지 절약할 수 있어요</p>
              </>
            ) : (
              <>
                <h2>빈틈이 없어요!</h2>
                <p>구독을 잘 관리하고 계시네요</p>
              </>
            )}
            <button className="btn" type="button" onClick={() => router.push("/inspect")}>구독 점검받기</button>
          </div>
          <div className="chip-row" style={{ margin: "14px 0 8px" }}>
            {KIND_FILTERS.map((f) => (
              <button key={f.id} className={`chip outline ${kind === f.id ? "on" : ""}`} type="button" onClick={() => setKind(f.id)}>{f.label}</button>
            ))}
          </div>
          <div className="section-title" style={{ marginTop: 4 }}>인기 구독 혜택</div>
          {list.length === 0 ? (
            <div className="empty">
              <img className="teumki-illust" src="/teumki/card.png" alt="" />
              <p>{kindLabel}으로 받을 수 있는 등록된 구독이 없어요.</p>
            </div>
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
                  <div className="linkish" style={{ textAlign: "right", marginTop: 8 }}>자세히 보기 ›</div>
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
