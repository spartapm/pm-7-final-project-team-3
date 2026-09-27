"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand, Gate, PhoneShell, TabBar } from "@/components/ui";
import { inspectLeaks, monthlyAmount } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { won, ymd } from "@/lib/format";
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
  const live = (subscriptions ?? []).filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const cold = live.length === 0;
  const leak = loaded ? inspectLeaks(live, benefits, bundles) : { count: 0, save: 0, unusedCount: 0, bundleSave: 0, tipCount: 0, tips: [] };
  const total = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  const ranked = live.slice().sort((a, b) => Number(b.unused) - Number(a.unused) || String(a.name ?? "").localeCompare(String(b.name ?? "")));
  const shown = open ? ranked : ranked.slice(0, 3);
  const tips = leak.tips.length ? leak.tips : (() => {
    try { return loaded ? bundleTips(live, benefits, bundles) : []; } catch { return []; }
  })();
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
        <div className="insp-head">
          <button className="icon-btn" type="button" aria-label="뒤로가기" onClick={() => router.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12H4M10 6l-6 6 6 6" />
            </svg>
          </button>
          <h1>AI 구독 점검</h1>
        </div>
        <div className="scroll tabbed insp">
          <div className="insp-hero">
            <img className="hero-logo" src="/brand/logo-banner.png" alt="" />
            <h2>
              {cold
                ? "등록된 구독이 없어요"
                : leak.save > 0
                  ? `새는 구독 ${Math.max(leak.count, 1)}개를 찾았어요`
                  : "빈틈이 없어요!"}
            </h2>
            <p>
              {cold
                ? "구독을 먼저 등록하면 새는 틈을 찾아드려요."
                : leak.save > 0
                  ? "지금 바로 확인하고 아껴보세요!"
                  : "구독을 잘 관리하고 계시네요."}
            </p>
            <button className="btn" type="button" disabled={cold} onClick={() => rerun()}>다시 점검하기</button>
          </div>
          <div className="insp-subs">
            <div className="insp-subs-title">현재 구독 중인 서비스</div>
            {cold ? (
              <div className="insp-empty">
                <img src="/teumki/default.png" alt="" />
                <p>등록된 구독 상품이 없어요.<br />추가해 주세요.</p>
              </div>
            ) : shown.map((s) => (
              <button key={s.id} className="insp-row" type="button" onClick={() => { track("inspection_result_select", { result_type: "subscription" }); router.push(`/subscriptions/${s.id}`); }}>
                <Brand name={s.name} color={s.color} logo={s.logo} />
                <span className="grow">
                  <b>{s.name}</b>
                  <em>
                    {s.status === "trial" ? "무료체험" : `${s.cycle === "yearly" ? "연" : s.cycle === "weekly" ? "주" : "월"} 정기 결제`}
                  </em>
                </span>
                <span className="amt">{won(monthlyAmount(s.amount, s.cycle))}</span>
              </button>
            ))}
            {live.length > 3 ? (
              <button className="insp-expand" type="button" onClick={() => setOpen((v) => !v)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={open ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} />
                </svg>
                {open ? "접기" : "펼쳐보기"}
              </button>
            ) : null}
            <div className="insp-total">
              <span>총 월 구독료</span>
              <strong>{total.toLocaleString("ko-KR")}<small>원</small></strong>
            </div>
          </div>
          {cold ? null : (
            <>
              <div className="insp-sec">AI가 추천하는 결합상품</div>
              {tips.length === 0 ? (
                <div className="empty" style={{ background: "transparent" }}>지금 결합할 수 있는 상품이 없어요.</div>
              ) : tips.map((t) => {
                const blob = `${t.names.join(" ")} ${t.headline}`;
                const theme = /배민|유튜브|youtube/i.test(blob)
                  ? "#F4B5C0"
                  : /네이버|스포티/i.test(blob)
                    ? "#8FD6A9"
                    : (t.colors[t.colors.length - 1] || t.colors[0] || "#3182F6");
                const cut = Math.max(0, t.solo - t.bundle);
                const rate = t.solo > 0 ? Math.round((cut / t.solo) * 100) : 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className="rec-card"
                    style={{ ["--theme" as string]: theme }}
                    onClick={() => { track("inspection_result_select", { result_type: "combine" }); router.push(t.href); }}
                  >
                    <div className="rec-top">
                      {t.names.map((name, i) => (
                        <span key={`${t.id}-${name}`} className="rec-logo-wrap">
                          {i > 0 ? <span className="rec-plus">+</span> : null}
                          <Brand name={name} color={t.colors[i] || "#3182F6"} logo={t.logos?.[i] || ""} />
                        </span>
                      ))}
                      <span className="rec-tag">결합상품</span>
                      <span className="rec-more">자세히 보기 ›</span>
                    </div>
                    <div className="rec-title">{t.headline}</div>
                    <div className="rec-price">
                      <s>{won(t.solo)}</s>
                      <span className="arrow">→</span>
                      <strong>{t.bundle.toLocaleString("ko-KR")}<small>원</small></strong>
                      <span className="per">/월</span>
                      {rate > 0 ? <span className="rate">-{rate}%</span> : null}
                    </div>
                    <div className="rec-save">매달 {won(cut)} 절약</div>
                  </button>
                );
              })}
            </>
          )}
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
