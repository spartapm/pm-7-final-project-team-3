"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell, TabBar } from "@/components/ui";
import { bundleIconSrc } from "@/lib/bundle-icon";
import { won } from "@/lib/format";
import { track, useGaView } from "@/lib/ga";
import { useBenefits } from "@/lib/use-benefits";
import { useStore } from "@/lib/store";

export default function BenefitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useStore();
  const { benefits, loaded, error, reload } = useBenefits();
  const b = benefits.find((x) => x.id === id);
  const color = b?.brandColor || b?.providerColor || "#3182f6";
  const single = b?.priceSingle ?? 0;
  const bundle = b?.priceBundle ?? 0;
  const off = single > bundle ? single - bundle : 0;
  const steps = b?.steps ?? (b?.howTo ? [b.howTo] : []);
  const terms = b?.termsList ?? (b?.terms ? [b.terms] : []);
  const official = b?.officialUrl || b?.href;
  const combine = Boolean(b?.parent || b?.kind === "carrier");
  useGaView(combine ? "combine_detail_view" : "benefit_detail_view", {}, loaded && Boolean(b) && !error);
  if (!loaded) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar">
            <span className="logo-mark" aria-hidden><i className="bar" /><i className="gap" /><i className="bar" /></span>
            <span style={{ flex: 1 }} />
            <button className="icon-btn" type="button" aria-label="닫기" onClick={() => router.push("/benefits")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="wait">
            <img className="teumki-illust" src="/teumki/loading.png" alt="" />
            <h2>혜택을 불러오는 중이에요</h2>
            <p className="muted">자세한 혜택 내용을 불러오고 있어요.<br />잠시만 기다려주세요.</p>
            <p className="inspect-note">ⓘ 분석 결과는 등록된 정보와 공개된 요금제를 기준으로 계산한 예상치예요.</p>
          </div>
        </PhoneShell>
      </Gate>
    );
  }
  if (!b || error) {
    return (
      <Gate>
        <PhoneShell>
          <div className="wait">
            <img className="teumki-illust" src="/teumki/sad.png" alt="" />
            <h2>혜택을 불러오지 못했어요</h2>
            <p className="muted">일시적인 오류로 혜택 상세 내용을 불러오지 못했어요.<br />잠시 후 다시 시도해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => reload()}>다시 시도하기</button>
            <div style={{ height: 8 }} />
            <button className="btn outline" type="button" onClick={() => router.push("/benefits")}>혜택 홈으로 돌아가기</button>
          </div>
        </PhoneShell>
      </Gate>
    );
  }
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back />
          <h1>혜택 상세</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll tabbed bnf-detail">
          <>
              <div className="bnf-k">현재 선택한 결합상품</div>
              <div className="bnf-card" style={{ borderColor: color }}>
                {off > 0 ? <span className="bnf-off">{won(off)} 할인</span> : null}
                <div className="bnf-icons">
                  <img
                    src={bundleIconSrc(b.icon)}
                    alt=""
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/brand/logo-mark.png"; }}
                  />
                </div>
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
              <p className="muted" style={{ fontSize: 12, margin: "12px 4px 0" }}>출처: {b.source ?? "각 사 공식 결합·멤버십 안내"} · 기준일 {b.asOf ?? "2026.09.01"} · 실제 요금은 공식 페이지 확인</p>
              <div style={{ height: 16 }} />
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  track(combine ? "combine_outbound_select" : "benefit_use_select", { destination_type: "official" });
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
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
