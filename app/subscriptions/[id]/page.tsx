"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Brand, Gate, Modal, PhoneShell } from "@/components/ui";
import { CATEGORIES, isBundleLike } from "@/lib/catalog";
import { dateLabel, won } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function SubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { subscriptions, removeSub, upsertSub, showToast } = useStore();
  const sub = subscriptions.find((s) => s.id === id);
  const [del, setDel] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  if (!sub) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar"><Back href="/subscriptions" /><h1>구독 상세</h1><span style={{ width: 36 }} /></div>
          <div className="scroll"><div className="empty">구독을 찾을 수 없어요.</div></div>
        </PhoneShell>
      </Gate>
    );
  }
  const cat = CATEGORIES.find((c) => c.id === sub.category)?.label ?? sub.category;
  const paused = sub.paused || sub.status === "paused";
  const statusLabel = sub.status === "trial" ? "무료체험" : paused ? "일시정지" : "이용 중";
  const badgeCls = sub.status === "trial" ? "trial" : paused ? "pause" : "on";
  const child = Boolean(sub.parentId);
  const monthly = sub.status === "trial" ? 0 : sub.amount;
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back href="/subscriptions" />
          <h1>구독 상세</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Brand name={sub.name} color={sub.color} logo={sub.logo} />
            <div className="grow">
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {sub.name}
                {isBundleLike(sub) ? <span className="bundle-tag">결합상품</span> : null}
              </div>
              <div className="muted">{sub.plan || cat}</div>
            </div>
            <button className={`sub-badge ${badgeCls}`} type="button" onClick={() => setStatusOpen((v) => !v)}>{statusLabel} ▾</button>
          </div>
          {statusOpen ? (
            <div className="status-pop">
              <p className="muted" style={{ padding: "4px 12px", fontWeight: 800 }}>이용 상태 변경</p>
              {(["active", "paused"] as const).map((st) => (
                <button
                  key={st}
                  className={(!paused && st === "active") || (paused && st === "paused") ? "on" : ""}
                  type="button"
                  onClick={() => {
                    upsertSub({
                      ...sub,
                      paused: st === "paused",
                      status: st === "paused" ? "paused" : sub.trialEnds ? "trial" : "active",
                    });
                    setStatusOpen(false);
                    showToast(st === "paused" ? "구독이 일시정지되었어요. 결제일 알림은 멈춥니다." : "구독 이용을 다시 시작했어요.");
                  }}
                >
                  {st === "active" ? "이용 중" : "일시정지"}
                </button>
              ))}
            </div>
          ) : null}
          {isBundleLike(sub) ? (
            <div className="warn-banner">⚠️  결합 상품 재선택시 구독 서비스를 새로 등록해주세요.</div>
          ) : null}
          {sub.status === "trial" && sub.trialEnds ? (
            <div className="teum-note">
              틈이 확인했어요
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {dateLabel(sub.trialEnds)}에 무료체험이 끝나고, {won(sub.amount)}으로 전환될 예정이에요.
              </div>
            </div>
          ) : sub.unused && !paused ? (
            <div className="warn-banner">
              최근 이용이 보이지 않아 새는 구독으로 표시했어요. 계속 쓸지 점검 화면에서 확인해 보세요.
              <div>
                <button type="button" onClick={() => router.push("/inspect")}>구독 점검하기 ›</button>
              </div>
            </div>
          ) : null}
          <div className="card" style={{ marginTop: 12 }}>
            <Row k="요금제" v={sub.plan || "-"} />
            <Row k="월 결제 금액" v={won(monthly)} />
            <Row k="다음 결제" v={dateLabel(sub.nextPay)} />
            <Row k="결제 주기" v={sub.cycle === "yearly" ? "연" : sub.cycle === "weekly" ? "주" : "월"} />
            <Row k="결제 수단" v={sub.payMethod || "-"} />
            {sub.status === "trial" ? <Row k="무료체험" v={sub.trialEnds ? dateLabel(sub.trialEnds) : "진행 중"} /> : null}
            {sub.memo ? <Row k="메모" v={sub.memo} /> : null}
          </div>
          <div style={{ height: 16 }} />
          <button className="btn primary" type="button" onClick={() => router.push(`/subscriptions/${sub.id}/edit`)}>정보 수정</button>
          <div style={{ height: 8 }} />
          <button
            className="btn danger"
            type="button"
            onClick={() => {
              if (child) {
                showToast("결합상품은 모상품에서만 삭제할 수 있어요.", "err");
                return;
              }
              setDel(true);
            }}
          >
            삭제
          </button>
        </div>
        {del ? (
          <Modal
            title="이 구독을 삭제하시겠어요?"
            body="삭제하면 복구할 수 없어요"
            confirm="삭제"
            danger
            mascot="/teumki/shock.png"
            onCancel={() => setDel(false)}
            onConfirm={() => {
              subscriptions.filter((s) => s.parentId === sub.id).forEach((s) => removeSub(s.id));
              removeSub(sub.id);
              router.replace("/subscriptions");
            }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row">
      <span className="muted">{k}</span>
      <span className="grow" style={{ textAlign: "right", fontWeight: 700 }}>{v}</span>
    </div>
  );
}
