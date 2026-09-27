"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipScroller, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BenefitIcons } from "@/components/BenefitIcons";
import { benefitStatus } from "@/lib/catalog";
import { DEFAULT_BENEFIT_FILTERS } from "@/lib/catalog-cats";
import { daysUntil } from "@/lib/format";
import { useBenefits } from "@/lib/use-benefits";
import { markInspectStart, track, useGaView } from "@/lib/ga";
import { useStore } from "@/lib/store";

export default function BenefitsPage() {
  const router = useRouter();
  const { subscriptions } = useStore();
  const { benefits, benefitFilters, loaded } = useBenefits();
  const [kind, setKind] = useState("전체");
  const filters = benefitFilters.length ? benefitFilters : [...DEFAULT_BENEFIT_FILTERS];
  const kindLabel = kind;
  useGaView("benefit_list_view", {}, loaded);
  const list = (benefits ?? [])
    .filter((b) => !b.expires || daysUntil(b.expires) >= 0)
    .filter((b) => kind === "전체" || (b.benefitCategories ?? []).includes(kind))
    .slice()
    .sort((a, b) => {
      const ai = Math.min(...(a.benefitCategories ?? []).map((n) => filters.indexOf(n)).filter((n) => n >= 0), 99);
      const bi = Math.min(...(b.benefitCategories ?? []).map((n) => filters.indexOf(n)).filter((n) => n >= 0), 99);
      return ai - bi;
    });
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar left hero"><h1>혜택</h1></div>
        <div className="scroll tabbed">
          <div className="hero-dark">
            <img
              className="hero-logo"
              src="/brand/logo-banner-white.png"
              alt=""
            />
            <h2>지금 새는 구독을 찾아보세요</h2>
            <p>AI로 구독을 점검하고 더 알뜰하게 이용할 방법을 확인해보세요.</p>
            <button className="btn" type="button" onClick={() => { markInspectStart("benefits"); track("subscription_inspection_start", { source: "benefits" }); router.push("/inspect"); }}>구독 점검하기</button>
          </div>
          <ChipScroller style={{ margin: "14px 0 8px" }}>
            {filters.map((f) => (
              <button key={f} className={`chip outline ${kind === f ? "on" : ""}`} type="button" onClick={() => { setKind(f); track("benefit_filter_select", { filter_type: f }); }}>{f}</button>
            ))}
          </ChipScroller>
          <div className="section-title" style={{ marginTop: 4 }}>인기 구독 혜택</div>
          {!loaded ? null : list.length === 0 ? (
            <div className="empty">
              <img className="teumki-illust" src="/teumki/card.png" alt="" />
              <p>{kindLabel}에서 받을 수 있는 등록된 구독이 없어요.</p>
            </div>
          ) : list.map((b) => {
            const expiring = benefitStatus(b, subscriptions ?? []) === "expiring";
            return (
              <button key={b.id} className="benefit-card" type="button" onClick={() => router.push(`/benefits/${b.id}`)} style={{ width: "100%", textAlign: "left" }}>
                <BenefitIcons b={b} />
                <span className="body">
                  <span className="tag" style={{ background: b.providerColor }}>{b.provider}</span>
                  {expiring ? <span className="tag" style={{ background: "#ff7700", marginLeft: 6 }}>만료 예정</span> : null}
                  <div style={{ fontWeight: 800, margin: "4px 0" }}>{b.title}</div>
                  <div className="muted">{b.body}</div>
                  {b.expires ? <div className="muted" style={{ marginTop: 6 }}>{daysUntil(b.expires) >= 0 ? `${daysUntil(b.expires)}일 뒤 만료` : "만료됨"}</div> : null}
                  <div className="linkish" style={{ textAlign: "right", marginTop: 8 }}>자세히 보기 ›</div>
                </span>
              </button>
            );
          })}
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
