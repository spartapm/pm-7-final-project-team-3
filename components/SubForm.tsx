"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WhenPick } from "@/components/WhenPick";
import { Back, Brand, Gate, Modal, PhoneShell } from "@/components/ui";
import { findBrand } from "@/lib/brands";
import { categorySelectOptions, emptyDraft, searchServices } from "@/lib/catalog";
import { draftFromSubItem, readExtract, subItemFromDraft, upsertExtractItem } from "@/lib/extract";
import { dateLabel, uid, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BillingCycle, Category, DraftSub, ExtractSubItem, Subscription } from "@/lib/types";

function fromSub(s: Subscription): DraftSub {
  return {
    name: s.name,
    plan: s.plan,
    category: s.category,
    amount: String(s.amount),
    cycle: s.cycle,
    everyMonths: s.everyMonths ?? (s.cycle === "yearly" ? 12 : 1),
    payDay: String(s.payDay),
    nextPay: s.nextPay,
    autoRenew: s.autoRenew,
    memo: s.memo,
    status: s.status,
    trialEnds: s.trialEnds ?? "",
    alertDays: s.alertDays,
    fromAi: false,
    payMethod: s.payMethod ?? "",
    trialDays: s.trialEnds ? String(Math.max(1, Math.round((Date.parse(s.trialEnds) - Date.now()) / 86400000))) : "",
  };
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SubForm({
  existingId,
  check = false,
  fromResult = false,
  extractId = null,
}: {
  existingId: string | null;
  check?: boolean;
  fromResult?: boolean;
  extractId?: string | null;
}) {
  const router = useRouter();
  const { subscriptions, upsertSub, draft, setDraft, resetDraft, showToast } = useStore();
  const existing = existingId ? subscriptions.find((s) => s.id === existingId) : null;
  const [local, setLocal] = useState<DraftSub>(existing ? fromSub(existing) : draft);
  const [open, setOpen] = useState(false);
  const [trialOn, setTrialOn] = useState((existing?.status ?? draft.status) === "trial");
  const [alertOn, setAlertOn] = useState(existing ? existing.alertDays > 0 : false);
  const [leave, setLeave] = useState(false);
  const [payPick, setPayPick] = useState(false);
  useEffect(() => {
    if (fromResult && extractId) {
      const cur = readExtract();
      const item = cur?.items.find((x): x is ExtractSubItem => x.id === extractId && x.kind === "subscription");
      if (item) {
        setLocal(draftFromSubItem(item));
        setTrialOn(item.status === "trial");
        setAlertOn(item.alertDays > 0);
      } else {
        setLocal({ ...emptyDraft(), fromAi: true });
        setTrialOn(false);
        setAlertOn(false);
      }
      return;
    }
    if (!existingId && draft.name) setLocal({ ...draft, payMethod: draft.payMethod ?? "", trialDays: draft.trialDays ?? "" });
  }, [draft, existingId, extractId, fromResult]);

  const hits = useMemo(() => searchServices(local.name), [local.name]);
  const known = findBrand(local.name);
  const nameOk = local.name.trim().length >= 2 && local.name.trim().length <= 30 && local.name.trim().toUpperCase() !== "NULL";
  const amountOk = trialOn || Boolean(local.amount.replace(/[^0-9]/g, ""));
  const dateOk = Boolean(local.nextPay);
  const trialOk = !trialOn || (/^\d{1,2}$/.test(local.trialDays) && Number(local.trialDays) >= 1 && Number(local.trialDays) <= 99);
  const canSave = nameOk && amountOk && dateOk && trialOk;

  const pick = (name: string) => {
    const hit = findBrand(name);
    setLocal((p) => ({
      ...p,
      name,
      category: hit?.category ?? p.category,
      amount: hit?.amount ? String(hit.amount) : p.amount,
    }));
    setOpen(false);
  };

  const goResult = () => {
    const cur = readExtract();
    router.replace(`/add/result?kind=subscription&from=${cur?.from ?? "image"}`);
  };

  const save = () => {
    if (!canSave) {
      showToast("필수 항목을 입력해 주세요.", "err");
      return;
    }
    if (fromResult) {
      const id = extractId && extractId !== "new" ? extractId : uid("ex");
      upsertExtractItem(subItemFromDraft(id, local, trialOn, alertOn));
      goResult();
      return;
    }
    const amount = Number(local.amount.replace(/[^0-9]/g, "")) || 0;
    const payDay = Number(local.nextPay.slice(8, 10)) || 1;
    const color = known?.color ?? "#2576f2";
    const logo = "";
    const trialEnds = trialOn ? addDays(local.nextPay, Number(local.trialDays) || 14) : null;
    try {
      const id = existing?.id ?? uid("sub");
      upsertSub({
        id,
        name: local.name.trim(),
        plan: local.plan,
        category: local.category,
        amount,
        cycle: local.cycle,
        everyMonths: local.everyMonths ?? (local.cycle === "yearly" ? 12 : 1),
        payDay,
        nextPay: local.nextPay,
        status: trialOn ? "trial" : local.status === "paused" ? "paused" : "active",
        autoRenew: local.autoRenew,
        unused: existing?.unused ?? false,
        memo: local.memo,
        color,
        logo,
        trialEnds,
        paused: local.status === "paused",
        alertDays: alertOn ? (local.alertDays || 3) : 0,
        createdAt: existing?.createdAt ?? Date.now(),
        payMethod: local.payMethod,
        parentId: existing?.parentId,
      });
      resetDraft();
      sessionStorage.setItem("teum:last-sub", JSON.stringify({
        id,
        name: local.name.trim(),
        amount,
        cycle: local.cycle,
        alert: alertOn,
      }));
      router.replace("/subscriptions/saved");
    } catch {
      showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
    }
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => { if (fromResult) goResult(); else setLeave(true); }} />
          <h1>{check || local.fromAi ? "구독 등록/수정" : existing ? "구독 수정" : "구독 등록"}</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <p style={{ fontWeight: 800, fontSize: 20, margin: "4px 0 14px" }}>{check || local.fromAi ? "구독 정보를 작성해주세요" : "구독 정보를 수정해주세요"}</p>
          {local.fromAi || check ? <div className="cold-bar" style={{ marginBottom: 12 }}>AI 초안입니다. 저장하기 전에는 내 구독에 들어가지 않아요.</div> : null}
          {trialOn ? <p className="field-hint">ⓘ 무료체험의 경우 첫 결제는 결제금액을 0으로 입력해주세요.</p> : null}
          <div className="field">
            <label>서비스명 <i className="req">*</i></label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Brand name={known?.name ?? local.name} color={known?.color ?? "#2576f2"} logo="" />
              <input
                style={{ flex: 1 }}
                value={local.name}
                maxLength={30}
                placeholder="서비스명 입력"
                onFocus={() => setOpen(true)}
                onChange={(e) => { setLocal((p) => ({ ...p, name: e.target.value })); setOpen(true); }}
              />
            </div>
            {open && hits.length > 0 && !known ? (
              <div className="svc-suggest">
                {hits.map((s) => (
                  <button key={s.name} type="button" onClick={() => pick(s.name)}>
                    <Brand name={s.name} color={s.color} logo={s.logo} />
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="field">
            <label>첫 결제일 <i className="req">*</i></label>
            <button type="button" className="when-chip" onClick={() => setPayPick(true)}>
              {local.nextPay ? dateLabel(local.nextPay) : "날짜"}
            </button>
          </div>
          <div className="field">
            <label>결제 주기 <i className="req">*</i></label>
            <div className="amt-row">
              <input
                inputMode="numeric"
                value={String(local.everyMonths ?? (local.cycle === "yearly" ? 12 : 1))}
                onChange={(e) => {
                  const n = Math.min(99, Math.max(1, Number(e.target.value.replace(/[^0-9]/g, "")) || 1));
                  setLocal((p) => ({ ...p, everyMonths: n, cycle: n === 12 ? "yearly" : "monthly" }));
                }}
              />
              <span>개월</span>
            </div>
          </div>
          <div className="field">
            <label>결제 금액 <i className="req">*</i></label>
            <div className="amt-row">
              <input inputMode="numeric" value={local.amount} onChange={(e) => setLocal((p) => ({ ...p, amount: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="17000" />
              <span>원</span>
            </div>
            {known && local.amount && Number(local.amount.replace(/[^0-9]/g, "")) !== known.amount ? (
              <p className="mismatch-warn">⚠️ {known.name} 요금제와 달라요, 확인해주세요</p>
            ) : null}
          </div>
          <label className="check" style={{ alignItems: "center" }}>
            <span className="grow">무료체험</span>
            <button className={`switch ${trialOn ? "on" : ""}`} type="button" aria-label="무료체험" onClick={() => {
              setTrialOn((v) => {
                const next = !v;
                setLocal((p) => ({ ...p, status: next ? "trial" : "active", amount: next && !p.amount ? "0" : p.amount }));
                return next;
              });
            }}><i /></button>
          </label>
          {trialOn ? (
            <div className="field">
              <label>무료 체험 기간 <i className="req">*</i></label>
              <input inputMode="numeric" value={local.trialDays} maxLength={2} placeholder="체험 기간을 입력해주세요" onChange={(e) => setLocal((p) => ({ ...p, trialDays: e.target.value.replace(/[^0-9]/g, "") }))} />
              <p className="field-hint">ⓘ 무료체험 기간이 종료되면 자동으로 위에 설정된 결제 금액으로 표기됩니다.</p>
            </div>
          ) : null}
          <div className="field">
            <label>카테고리</label>
            <select value={local.category} onChange={(e) => setLocal((p) => ({ ...p, category: e.target.value as Category }))}>
              {categorySelectOptions(local.category).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>요금제</label>
            <input value={local.plan} onChange={(e) => setLocal((p) => ({ ...p, plan: e.target.value }))} placeholder="스탠다드, Plus 등" />
          </div>
          <div className="field">
            <label>결제 수단</label>
            <input value={local.payMethod} maxLength={10} onChange={(e) => setLocal((p) => ({ ...p, payMethod: e.target.value }))} placeholder="결제수단의 별칭을 입력해주세요" />
          </div>
          <label className="check" style={{ alignItems: "center" }}>
            <span className="grow">
              이 서비스 결제 예정 알림
              <span className="muted" style={{ display: "block", fontWeight: 500 }}>결제 3일 전에 알림을 보내드려요.</span>
            </span>
            <button className={`switch ${alertOn ? "on" : ""}`} type="button" aria-label="알림" onClick={() => setAlertOn((v) => !v)}><i /></button>
          </label>
          {alertOn ? (
            <div className="field">
              <label>알림 (며칠 전)</label>
              <input inputMode="numeric" value={local.alertDays} onChange={(e) => setLocal((p) => ({ ...p, alertDays: Number(e.target.value) || 0 }))} />
            </div>
          ) : null}
          <div className="field">
            <label>메모</label>
            <textarea value={local.memo} onChange={(e) => setLocal((p) => ({ ...p, memo: e.target.value }))} placeholder="해지 가능일 · 종료일 · 메모 (선택)" />
          </div>
          <button className="btn primary" type="button" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.4 }} onClick={() => { setDraft(local); save(); }}>저장하기</button>
        </div>
        <WhenPick
          open={payPick}
          allDay
          date={local.nextPay}
          time=""
          minDate={ymd(new Date())}
          onCancel={() => setPayPick(false)}
          onPick={(d) => {
            setLocal((p) => ({ ...p, nextPay: d, payDay: String(Number(d.slice(8, 10)) || 1) }));
            setPayPick(false);
          }}
        />
        {leave ? (
          <Modal
            title="작성을 중단하시겠어요?"
            body={"작성중이던 내용은 저장되지 않아요.\n이전 화면으로 이동할까요?"}
            cancel="계속 작성하기"
            confirm="나가기"
            mascot="/teumki/curious.png"
            onCancel={() => setLeave(false)}
            onConfirm={() => {
              resetDraft();
              if (existing) router.push(`/subscriptions/${existing.id}`);
              else router.push(check ? "/home" : "/subscriptions");
            }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
