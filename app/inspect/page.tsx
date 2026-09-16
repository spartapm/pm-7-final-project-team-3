"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Brand, Gate, PhoneShell, TabBar } from "@/components/ui";
import { leaksOf, monthlyAmount } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cycleEvery, won, ymd } from "@/lib/format";
import { bundleTips } from "@/lib/recommend";
import { inspectMeta, markInspectStart, track, useGaView } from "@/lib/ga";
import { useBenefits } from "@/lib/use-benefits";

const INSPECT_KEY = "teum:inspect-stamp";

function stampOf(day: string, ids: string[]) {
  return `${day}|${ids.slice().sort().join(",")}`;
}

export default function InspectPage() {
  const router = useRouter();
  const { subscriptions, showToast } = useStore();
  const { benefits, bundles, loaded } = useBenefits();
  const [waiting, setWaiting] = useState(true);
  const [fail, setFail] = useState(false);
  const [open, setOpen] = useState(false);
  const live = subscriptions.filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const cold = live.length === 0;
  const leak = leaksOf(live);
  const total = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  const ranked = live.slice().sort((a, b) => Number(b.unused) - Number(a.unused) || a.name.localeCompare(b.name));
  const shown = open ? ranked : ranked.slice(0, 3);
  const tips = loaded ? bundleTips(live, benefits, bundles) : [];
  const today = ymd(new Date());
  const curStamp = stampOf(today, live.map((s) => s.id));

  useEffect(() => {
    if (typeof window === "undefined" || !loaded) return;
    if (localStorage.getItem(INSPECT_KEY) === curStamp) {
      setWaiting(false);
      return;
    }
    const t = window.setTimeout(() => {
      localStorage.setItem(INSPECT_KEY, curStamp);
      setWaiting(false);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [curStamp, loaded]);

  const rerun = (fromFail = false) => {
    if (localStorage.getItem(INSPECT_KEY) === curStamp) {
      showToast("구독 점검은 하루에 한 번만 가능합니다. 내일 다시 점검해주세요.");
      return;
    }
    localStorage.setItem(INSPECT_KEY, curStamp);
    markInspectStart("benefits");
    if (fromFail) track("inspection_retry_select");
    track("subscription_inspection_start", { source: "benefits", inspection_type: "retry" });
    setWaiting(true);
    setFail(false);
    window.setTimeout(() => setWaiting(false), 1400);
  };

  useGaView("subscription_inspection_complete", {
    result_status: cold ? "empty" : leak.count > 0 ? "leak" : "ok",
    ...inspectMeta(),
  }, loaded && !waiting && !fail);
  useGaView("subscription_inspection_failed", inspectMeta(), fail);

  if (waiting || !loaded) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar">
            <button className="icon-btn" type="button" aria-label="닫기" onClick={() => { setWaiting(false); router.push("/benefits"); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <span style={{ flex: 1 }} />
          </div>
          <div className="wait">
            <img className="teumki-illust" src="/teumki/loading.png" alt="" />
            <h2>구독 사이 새는 틈을 찾고 있어요</h2>
            <p className="muted">등록한 구독의 요금과 혜택을<br />하나씩 비교하고 있어요.</p>
            <p className="inspect-note">ⓘ 분석 결과는 등록된 정보와 공개된 요금제를 기준으로 계산한 예상치예요.</p>
          </div>
        </PhoneShell>
      </Gate>
    );
  }

  if (fail) {
    return (
      <Gate>
        <PhoneShell>
          <div className="wait">
            <img className="teumki-illust" src="/teumki/sad.png" alt="" />
            <h2>구독 점검을 완료하지 못했어요</h2>
            <p className="muted">일시적인 오류로 분석이 중단됐어요.<br />잠시 후 다시 점검해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => rerun(true)}>다시 시도하기</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => router.push("/benefits")}>혜택 홈으로 돌아가기</button>
          </div>
        </PhoneShell>
      </Gate>
    );
  }

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back /><h1>AI 구독 점검</h1><span style={{ width: 36 }} /></div>
        <div className="scroll tabbed">
          <div className="insp-hero">
            <img className="hero-logo" src="/brand/logo-banner.png" alt="" />
            <h2>
              {cold
                ? "등록된 구독이 없어요"
                : leak.count > 0
                  ? `새는 구독 ${leak.count}개를 찾았어요`
                  : "빈틈이 없어요!"}
            </h2>
            <p>
              {cold
                ? "구독을 먼저 등록하면 새는 틈을 찾아드려요."
                : leak.count > 0
                  ? `지금 새는 구독료를 잠그면 매달 최대 ${won(leak.save)}까지 절약할 수 있어요`
                  : "구독을 잘 관리하고 계시네요."}
            </p>
            <button className="btn" type="button" disabled={cold} onClick={() => rerun()}>다시 점검하기</button>
          </div>
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 8 }}>현재 구독 중인 서비스</div>
            {shown.map((s) => (
              <button key={s.id} className="row" type="button" onClick={() => { track("inspection_result_select", { result_type: "subscription" }); router.push(`/subscriptions/${s.id}`); }} style={{ width: "100%", textAlign: "left" }}>
                <Brand name={s.name} color={s.color} logo={s.logo} />
                <span className="grow">
                  <div style={{ fontWeight: 800 }}>{s.name}</div>
                  <div className="muted">
                    {s.status === "trial" ? "무료체험" : `${cycleEvery(s.cycle)} 정기 결제`}
                    {s.unused ? " · 미사용 의심" : ""}
                  </div>
                </span>
                <span className="price">{won(monthlyAmount(s.amount, s.cycle))}</span>
              </button>
            ))}
            {live.length > 3 ? (
              <button className="expand-link" type="button" onClick={() => setOpen((v) => !v)}>{open ? "접기 ▴" : "펼쳐보기 ▾"}</button>
            ) : null}
            <div className="stat-split">
              <div>
                <div className="k">총 월 구독료</div>
                <div className="v">{won(total)}</div>
              </div>
              <div>
                <div className="k">새고 있는 금액 (매달)</div>
                <div className="v bad">{won(leak.save)}</div>
              </div>
            </div>
          </div>
          <div className="section-title">AI가 추천하는 결합상품 {tips.length}개</div>
          <p className="muted" style={{ marginTop: -6, marginBottom: 8 }}>지금 가진 구독 기준으로 결합할 수 있는 상품만 보여요.</p>
          {tips.length === 0 ? (
            <div className="empty" style={{ background: "transparent" }}>지금 결합할 수 있는 상품이 없어요.</div>
          ) : tips.map((t) => {
            const c1 = t.colors[0] || "#2576f2";
            const c2 = t.colors[1] || c1;
            return (
              <button
                key={t.id}
                type="button"
                className="rec-card"
                style={{ ["--c1" as string]: c1, ["--c2" as string]: c2 }}
                onClick={() => { track("inspection_result_select", { result_type: "combine" }); router.push(t.href); }}
              >
                <div className="rec-top">
                  <span className="rec-logos">
                    {t.names.map((name, i) => (
                      <span key={`${t.id}-${name}`} className="rec-logo-wrap">
                        {i > 0 ? <span className="rec-plus">+</span> : null}
                        <Brand name={name} color={t.colors[i] || "#2576f2"} logo={t.logos?.[i] || ""} />
                      </span>
                    ))}
                  </span>
                  <span className="rec-tag">결합상품</span>
                  <span className="rec-save">-{won(t.save)}</span>
                </div>
                <div className="rec-title">{t.headline}</div>
                <div className="rec-cmp">
                  <span className="old">개별 구독 시<br />{won(t.solo)}</span>
                  <span className="arrow">→</span>
                  <span className="new" style={{ color: c2 }}>결합 이용 시<br />{won(t.bundle)}</span>
                </div>
                <div className="rec-more">자세히 보기 ›</div>
              </button>
            );
          })}
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
