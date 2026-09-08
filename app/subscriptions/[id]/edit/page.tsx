"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { CATEGORIES, SERVICES } from "@/lib/catalog";
import { nextPayDate, uid } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BillingCycle, Category, DraftSub, SubStatus, Subscription } from "@/lib/types";

function fromSub(s: Subscription): DraftSub {
  return {
    name: s.name,
    plan: s.plan,
    category: s.category,
    amount: String(s.amount),
    cycle: s.cycle,
    payDay: String(s.payDay),
    nextPay: s.nextPay,
    autoRenew: s.autoRenew,
    memo: s.memo,
    status: s.status,
    trialEnds: s.trialEnds ?? "",
    alertDays: s.alertDays,
    fromAi: false,
  };
}

export default function SubEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SubForm existingId={id === "new" ? null : id} />;
}

export function SubForm({ existingId }: { existingId: string | null }) {
  const router = useRouter();
  const { subscriptions, upsertSub, draft, setDraft, resetDraft, showToast } = useStore();
  const existing = existingId ? subscriptions.find((s) => s.id === existingId) : null;
  const [local, setLocal] = useState<DraftSub>(existing ? fromSub(existing) : draft);
  useEffect(() => {
    if (!existingId && draft.name) setLocal(draft);
  }, [draft, existingId]);

  const save = () => {
    if (!local.name.trim() || !local.amount) {
      showToast("서비스명과 금액을 입력해 주세요.", "err");
      return;
    }
    const amount = Number(local.amount.replace(/[^0-9]/g, ""));
    const payDay = Math.min(31, Math.max(1, Number(local.payDay) || 1));
    const color = SERVICES.find((s) => s.name === local.name)?.color ?? "#2576f2";
    const logo = SERVICES.find((s) => s.name === local.name)?.logo ?? local.name.slice(0, 1);
    upsertSub({
      id: existing?.id ?? uid("sub"),
      name: local.name.trim(),
      plan: local.plan,
      category: local.category,
      amount,
      cycle: local.cycle,
      payDay,
      nextPay: local.nextPay || nextPayDate(payDay),
      status: local.status,
      autoRenew: local.autoRenew,
      unused: existing?.unused ?? false,
      memo: local.memo,
      color,
      logo,
      trialEnds: local.status === "trial" && local.trialEnds ? local.trialEnds : null,
      paused: local.status === "paused",
      alertDays: local.alertDays,
      createdAt: existing?.createdAt ?? Date.now(),
    });
    resetDraft();
    showToast("구독 정보가 저장되었습니다.");
    router.replace("/subscriptions/saved");
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back />
          <h1>{existing ? "구독 수정" : "구독 등록"}</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          {local.fromAi ? <div className="cold-bar" style={{ marginBottom: 12 }}>AI가 채운 값입니다. 확인 후 저장해야 목록에 반영돼요.</div> : null}
          <div className="field">
            <label>서비스</label>
            <input list="svc" value={local.name} onChange={(e) => {
              const name = e.target.value;
              const hit = SERVICES.find((s) => s.name === name);
              setLocal((p) => ({ ...p, name, category: hit?.category ?? p.category, amount: hit ? String(hit.amount) : p.amount }));
            }} placeholder="서비스명" />
            <datalist id="svc">{SERVICES.map((s) => <option key={s.name} value={s.name} />)}</datalist>
          </div>
          <div className="field">
            <label>요금제</label>
            <input value={local.plan} onChange={(e) => setLocal((p) => ({ ...p, plan: e.target.value }))} placeholder="스탠다드, Plus 등" />
          </div>
          <div className="field">
            <label>카테고리</label>
            <select value={local.category} onChange={(e) => setLocal((p) => ({ ...p, category: e.target.value as Category }))}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>결제 금액</label>
            <input inputMode="numeric" value={local.amount} onChange={(e) => setLocal((p) => ({ ...p, amount: e.target.value }))} placeholder="17000" />
          </div>
          <div className="field">
            <label>결제 주기</label>
            <select value={local.cycle} onChange={(e) => setLocal((p) => ({ ...p, cycle: e.target.value as BillingCycle }))}>
              <option value="monthly">월</option>
              <option value="yearly">연</option>
              <option value="weekly">주</option>
            </select>
          </div>
          <div className="field">
            <label>결제일 (1–31)</label>
            <input inputMode="numeric" value={local.payDay} onChange={(e) => setLocal((p) => ({ ...p, payDay: e.target.value, nextPay: nextPayDate(Number(e.target.value) || 1) }))} />
          </div>
          <div className="field">
            <label>다음 결제일</label>
            <input type="date" value={local.nextPay} onChange={(e) => setLocal((p) => ({ ...p, nextPay: e.target.value }))} />
          </div>
          <div className="field">
            <label>상태</label>
            <select value={local.status} onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as SubStatus }))}>
              <option value="active">이용 중</option>
              <option value="trial">무료체험</option>
              <option value="paused">일시정지</option>
              <option value="ended">종료</option>
            </select>
          </div>
          {local.status === "trial" ? (
            <div className="field">
              <label>체험 종료일</label>
              <input type="date" value={local.trialEnds} onChange={(e) => setLocal((p) => ({ ...p, trialEnds: e.target.value }))} />
            </div>
          ) : null}
          <label className="check">
            <input type="checkbox" checked={local.autoRenew} onChange={(e) => setLocal((p) => ({ ...p, autoRenew: e.target.checked }))} />
            자동 갱신
          </label>
          <div className="field">
            <label>알림 (며칠 전)</label>
            <input inputMode="numeric" value={local.alertDays} onChange={(e) => setLocal((p) => ({ ...p, alertDays: Number(e.target.value) || 0 }))} />
          </div>
          <div className="field">
            <label>메모</label>
            <textarea value={local.memo} onChange={(e) => setLocal((p) => ({ ...p, memo: e.target.value }))} placeholder="해지 가능일 · 종료일 · 메모 (선택)" />
          </div>
          <button className="btn primary" type="button" onClick={() => { setDraft(local); save(); }}>저장하기</button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
