"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BENEFITS } from "@/lib/catalog";
import { won } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function BenefitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useStore();
  const b = BENEFITS.find((x) => x.id === id);
  const color = b?.brandColor || b?.providerColor || "#3182f6";
  const single = b?.priceSingle ?? 0;
  const bundle = b?.priceBundle ?? 0;
  const off = single > bundle ? single - bundle : 0;
  const steps = b?.steps ?? (b?.howTo ? [b.howTo] : []);
  const terms = b?.termsList ?? (b?.terms ? [b.terms] : []);
  const official = b?.officialUrl || b?.href;
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back />
          <h1>혜택 상세</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll tabbed bnf-detail">
          {!b ? (
            <div className="empty">혜택을 찾을 수 없어요.</div>
          ) : (
            <>
              <div className="bnf-k">현재 선택한 결합상품</div>
              <div className="bnf-card" style={{ borderColor: color }}>
                {off > 0 ? <span className="bnf-off">{won(off)} 할인</span> : null}
                {b.copy ? (
                  <p className="bnf-copy">
                    {b.copy.prefix}
                    <span className="hi" style={{ color }}>{b.copy.highlight}</span>
                    {b.copy.middle}
                    <span className="pr">{b.copy.priceText}</span>
                    {b.copy.suffix}
                  </p>
                ) : (
                  <>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 8px" }}>{b.title}</h2>
                    <p className="muted" style={{ lineHeight: 1.55, margin: "0 0 12px" }}>{b.body}</p>
                  </>
                )}
                {b.parent ? (
                  <div className="bnf-row">
                    <span className="bnf-chip">모상품</span>
                    <span className="grow">
                      <b>{b.parent.name}</b>
                      <em>{b.parent.sub}</em>
                    </span>
                    <span className="bnf-keep">유지 시 결합</span>
                  </div>
                ) : null}
                {b.perk ? (
                  <div className="bnf-row">
                    <span className="bnf-chip soft">혜택상품</span>
                    <span className="grow">
                      <b>{b.perk.name}</b>
                      <em>{b.perk.sub}</em>
                    </span>
                    {single === bundle ? (
                      <div className="bnf-cmp"><div className="new">{won(bundle)}</div></div>
                    ) : (
                      <div className="bnf-cmp">
                        <div className="k">개별 구독 시</div>
                        <div className="old">{won(single)}</div>
                        <div className="k">결합 이용 시</div>
                        <div className="new">{won(bundle)}</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {steps.length > 0 ? (
                <>
                  <div className="section-title">신청 방법</div>
                  {steps.map((s, i) => (
                    <div key={i} className="bnf-step">
                      <i>{i + 1}</i>
                      <p>{s}</p>
                    </div>
                  ))}
                </>
              ) : null}
              {terms.length > 0 ? (
                <>
                  <div className="section-title">이용조건</div>
                  <ul className="bnf-terms">
                    {terms.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </>
              ) : null}
              <div style={{ height: 16 }} />
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  if (!official) {
                    showToast("혜택 페이지를 열 수 없어요. 잠시 후 다시 시도해주세요.", "err");
                    return;
                  }
                  const opened = window.open(official, "_blank", "noopener,noreferrer");
                  if (!opened) showToast("혜택 페이지를 열 수 없어요. 잠시 후 다시 시도해주세요.", "err");
                }}
              >
                공식 서비스에서 확인하기
              </button>
              <div style={{ height: 8 }} />
              <button className="btn outline" type="button" onClick={() => router.push("/benefits")}>메인으로 돌아가기</button>
            </>
          )}
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
