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
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back href="/subscriptions" />
          <h1>{sub.name}</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Brand name={sub.name} color={sub.color} logo={sub.logo} />
            <div className="grow">
              <div style={{ fontWeight: 800, fontSize: 18 }}>{sub.name}</div>
              <div className="muted">{sub.plan || cat}</div>
            </div>
            <span className={`sub-badge ${badgeCls}`}>{statusLabel}</span>
          </div>
          {sub.unused && !paused ? (
            <div className="warn-banner">
              최근 이용이 보이지 않아 새는 구독으로 표시했어요. 계속 쓸지 점검 화면에서 확인해 보세요.
              <div>
                <button type="button" onClick={() => router.push("/inspect")}>구독 점검하기 ›</button>
              </div>
            </div>
          ) : null}
          {isBundleLike(sub) ? (
            <div className="warn-banner">
              이 구독은 통신사·멤버십 결합에 포함될 수 있어요. 따로 결제 중인지 혜택 탭에서 확인해 보세요.
              <div>
                <button type="button" onClick={() => router.push("/benefits")}>혜택 확인하기 ›</button>
              </div>
            </div>
          ) : null}
          <div className="card" style={{ marginTop: 12 }}>
            <Row k="요금제" v={sub.plan || "-"} />
            <Row k="결제 금액" v={won(sub.amount)} />
            <Row k="결제 주기" v={sub.cycle === "yearly" ? "연" : sub.cycle === "weekly" ? "주" : "월"} />
            <Row k="다음 결제일" v={dateLabel(sub.nextPay)} />
            <Row k="자동 갱신" v={sub.autoRenew ? "켜짐" : "꺼짐"} />
            <Row k="상태" v={statusLabel} />
            {sub.trialEnds ? <Row k="체험 종료" v={dateLabel(sub.trialEnds)} /> : null}
            {sub.memo ? <Row k="메모" v={sub.memo} /> : null}
          </div>
          <div style={{ height: 16 }} />
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              const nextPaused = !paused;
              upsertSub({
                ...sub,
                paused: nextPaused,
                status: nextPaused ? "paused" : sub.trialEnds ? "trial" : "active",
              });
              showToast(nextPaused ? "구독이 일시정지되었어요. 결제일 알림은 멈춥니다." : "구독 이용을 다시 시작했어요.");
            }}
          >
            {paused ? "이용 재개" : "일시정지"}
          </button>
          <div style={{ height: 8 }} />
          <button className="btn primary" type="button" onClick={() => router.push(`/subscriptions/${sub.id}/edit`)}>정보 수정</button>
          <div style={{ height: 8 }} />
          <button className="btn danger" type="button" onClick={() => setDel(true)}>삭제</button>
        </div>
        {del ? (
          <Modal
            title="구독을 삭제할까요?"
            body="삭제하면 목록과 캘린더에서 사라집니다. 실제 서비스 해지는 해당 앱에서 직접 해야 해요."
            confirm="삭제"
            danger
            onCancel={() => setDel(false)}
            onConfirm={() => {
              removeSub(sub.id);
              showToast("구독이 삭제되었습니다.");
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
