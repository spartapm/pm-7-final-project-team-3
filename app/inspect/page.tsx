"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Brand, Gate, PhoneShell, TabBar } from "@/components/ui";
import { leaksOf, monthlyAmount } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { won } from "@/lib/format";

export default function InspectPage() {
  const router = useRouter();
  const { subscriptions } = useStore();
  const [waiting, setWaiting] = useState(false);
  const [fail, setFail] = useState(false);
  const [open, setOpen] = useState(false);
  const live = subscriptions.filter((s) => s.status !== "ended" && !s.paused);
  const leak = leaksOf(live);
  const total = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  const shown = open ? live : live.slice(0, 3);

  const rerun = () => {
    setWaiting(true);
    setFail(false);
    setTimeout(() => {
      setWaiting(false);
      if (Math.random() < 0.08) setFail(true);
    }, 1400);
  };

  if (waiting) {
    return (
      <Gate>
        <PhoneShell>
          <div className="wait">
            <div className="spinner" />
            <h2>구독을 점검하고 있어요</h2>
            <p className="muted">결합 혜택과 중복 결제를 대조하는 중이에요.</p>
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
            <h2>점검을 완료하지 못했어요</h2>
            <p className="muted">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
            <button className="btn primary" type="button" onClick={rerun}>다시 점검하기</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => router.push("/error")}>오류 화면 보기</button>
          </div>
        </PhoneShell>
      </Gate>
    );
  }

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/benefits" /><h1>AI 구독 점검</h1><span style={{ width: 36 }} /></div>
        <div className="scroll tabbed">
          <div className="insp-hero">
            <i className="mark" aria-hidden />
            <h2>{leak.count > 0 ? `새는 구독 ${leak.count}개를 찾았어요` : "새는 구독이 보이지 않아요"}</h2>
            <p>
              {leak.count > 0
                ? `지금 새는 구독료를 잠그면 매달 최대 ${won(leak.save)}까지 절약할 수 있어요`
                : "등록된 구독 기준으로는 중복·미사용이 뚜렷하지 않아요."}
            </p>
            <button className="btn" type="button" onClick={rerun}>다시 점검하기</button>
          </div>
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 8 }}>현재 구독 중인 서비스</div>
            {shown.map((s) => (
              <button key={s.id} className="row" type="button" onClick={() => router.push(`/subscriptions/${s.id}`)} style={{ width: "100%", textAlign: "left" }}>
                <Brand name={s.name} color={s.color} logo={s.logo} />
                <span className="grow">
                  <div style={{ fontWeight: 800 }}>{s.name}</div>
                  <div className="muted">월 정기 결제{s.unused ? " · 미사용 의심" : ""}</div>
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
          <div className="section-title">AI가 추천하는 결합상품</div>
          <p className="muted" style={{ marginTop: -6, marginBottom: 8 }}>추천은 참고용입니다. 자동 해지·변경은 하지 않아요.</p>
          <div className="bundle">
            <div className="bundle-head">
              <span>+ 결합상품</span>
              <span className="save">-10,900원</span>
            </div>
            <div style={{ fontWeight: 800 }}>네이버 플러스 멤버십으로 스포티파이까지</div>
            <div className="bundle-cmp">
              <span>개별 구독 시 15,800원</span>
              <span>→</span>
              <span className="good">결합 이용 시 4,900원</span>
            </div>
            <div style={{ textAlign: "right", marginTop: 8 }}><button className="linkish" type="button" onClick={() => router.push("/benefits/naver-spotify")}>자세히 보기 ›</button></div>
          </div>
          <div className="bundle pink">
            <div className="bundle-head">
              <span>+ 결합상품</span>
              <span className="save">-3,890원</span>
            </div>
            <div style={{ fontWeight: 800 }}>광고 없는 유튜브와 배민 혜택까지</div>
            <div className="bundle-cmp">
              <span>개별 구독 시 18,890원</span>
              <span>→</span>
              <span className="good">결합 이용 시 15,000원</span>
            </div>
            <div style={{ textAlign: "right", marginTop: 8 }}><button className="linkish" type="button" onClick={() => router.push("/benefits/lgu-disney")}>자세히 보기 ›</button></div>
          </div>
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
