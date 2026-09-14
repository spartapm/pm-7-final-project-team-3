"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WhenPick } from "@/components/WhenPick";
import { Back, Brand, Gate, Modal, PhoneShell } from "@/components/ui";
import { BUNDLE_PROVIDERS, findBundle, productsOf } from "@/lib/bundles";
import { findBrand, findBrandExact } from "@/lib/brands";
import { emptyDraft, searchServices } from "@/lib/catalog";
import { draftFromSubItem, readExtract, subItemFromDraft, upsertExtractItem } from "@/lib/extract";
import { dateLabel, uid, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BillingCycle, DraftSub, ExtractSubItem, Subscription } from "@/lib/types";

function digitsOf(v: string) {
  return v.replace(/[^0-9]/g, "");
}

function commaWon(v: string) {
  const d = digitsOf(v);
  if (!d) return "";
  return Number(d).toLocaleString("ko-KR");
}

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
    mode: s.bundleProvider || s.bundleId ? "bundle" : "solo",
    bundleProvider: s.bundleProvider ?? "",
    bundleId: s.bundleId ?? "",
    included: s.included ?? "",
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
  const [local, setLocal] = useState<DraftSub>(existing ? fromSub(existing) : emptyDraft());
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(Boolean(existing?.name));
  const [trialOn, setTrialOn] = useState((existing?.status ?? "") === "trial");
  const [alertOn, setAlertOn] = useState(existing ? existing.alertDays > 0 : false);
  const [leave, setLeave] = useState(false);
  const [payPick, setPayPick] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);
  const [dup, setDup] = useState(false);
  const [cycleText, setCycleText] = useState(() => String((existing ? fromSub(existing) : emptyDraft()).everyMonths ?? 1));
  const mode = local.mode === "bundle" ? "bundle" : "solo";

  useEffect(() => {
    if (fromResult && extractId) {
      const cur = readExtract();
      const item = cur?.items.find((x): x is ExtractSubItem => x.id === extractId && x.kind === "subscription");
      if (item) {
        setLocal(draftFromSubItem(item));
        setTrialOn(item.status === "trial");
        setAlertOn(item.alertDays > 0);
        setPicked(Boolean(item.name));
        setCycleText(String(item.cycle === "yearly" ? 12 : 1));
      } else {
        setLocal({ ...emptyDraft(), fromAi: true });
        setTrialOn(false);
        setAlertOn(false);
        setPicked(false);
        setCycleText("1");
      }
      return;
    }
    if (existingId) return;
    setLocal(emptyDraft());
    setTrialOn(false);
    setAlertOn(false);
    setPicked(false);
    setCycleText("1");
  }, [draft, existingId, extractId, fromResult]);

  const hits = useMemo(() => searchServices(local.name), [local.name]);
  const known = findBrandExact(local.name) ?? (picked ? findBrand(local.name) : undefined);
  const amountNum = Number(digitsOf(local.amount));
  const amountRangeOk = digitsOf(local.amount) === "" || (/^\d+$/.test(digitsOf(local.amount)) && amountNum >= 0 && amountNum <= 99999999);
  const nameOk = local.name.trim().length >= 2 && local.name.trim().length <= 30 && local.name.trim().toUpperCase() !== "NULL";
  const amountOk = trialOn || (Boolean(digitsOf(local.amount)) && amountRangeOk);
  const dateOk = Boolean(local.nextPay);
  const trialOk = !trialOn || (/^\d{1,2}$/.test(local.trialDays) && Number(local.trialDays) >= 1 && Number(local.trialDays) <= 99);
  const bundleOk = mode === "solo" || Boolean(local.bundleProvider && local.name.trim());
  const cycleOk = /^[1-9]\d?$/.test(cycleText) && Number(cycleText) >= 1 && Number(cycleText) <= 99;
  const canSave = nameOk && amountOk && dateOk && trialOk && bundleOk && cycleOk;
  const bundleList = local.bundleProvider ? productsOf(local.bundleProvider) : [];

  const pick = (name: string) => {
    const hit = findBrand(name);
    setLocal((p) => ({
      ...p,
      name,
      category: hit?.category ?? p.category,
      amount: hit?.amount ? String(hit.amount) : p.amount,
    }));
    setPicked(true);
    setOpen(false);
  };

  const setMode = (next: "solo" | "bundle") => {
    setLocal((p) => ({
      ...p,
      mode: next,
      name: "",
      bundleProvider: next === "bundle" ? p.bundleProvider : "",
      bundleId: "",
      included: "",
    }));
    setPicked(false);
    setOpen(false);
  };

  const goResult = () => {
    const cur = readExtract();
    router.replace(`/add/result?kind=subscription&from=${cur?.from ?? "image"}`);
  };

  const save = (force = false) => {
    setTried(true);
    if (saving) return;
    if (!nameOk || !amountOk || !dateOk || !trialOk || !bundleOk || !amountRangeOk) {
      return;
    }
    const amount = Number(digitsOf(local.amount)) || 0;
    const twin = subscriptions.find((s) => s.id !== existing?.id && s.name.trim().toLowerCase() === local.name.trim().toLowerCase() && s.amount === amount);
    if (twin && !force) {
      setDup(true);
      return;
    }
    if (fromResult) {
      const id = extractId && extractId !== "new" ? extractId : uid("ex");
      upsertExtractItem(subItemFromDraft(id, local, trialOn, alertOn));
      goResult();
      return;
    }
    const payDay = Number(local.nextPay.slice(8, 10)) || 1;
    const color = known?.color ?? "#2576f2";
    const trialEnds = trialOn ? addDays(local.nextPay, Number(local.trialDays) || 14) : null;
    const months = Number(cycleText);
    setSaving(true);
    try {
      const id = existing?.id ?? uid("sub");
      upsertSub({
        id,
        name: local.name.trim(),
        plan: local.plan,
        category: known?.category ?? local.category,
        amount,
        cycle: months === 12 ? "yearly" : local.cycle,
        everyMonths: months,
        payDay,
        nextPay: trialEnds || local.nextPay,
        status: trialOn ? "trial" : local.status === "paused" ? "paused" : "active",
        autoRenew: local.autoRenew,
        unused: existing?.unused ?? false,
        memo: local.memo,
        color,
        logo: "",
        trialEnds,
        paused: local.status === "paused",
        alertDays: alertOn ? (local.alertDays || 3) : 0,
        createdAt: existing?.createdAt ?? Date.now(),
        payMethod: local.payMethod,
        parentId: existing?.parentId,
        bundleProvider: mode === "bundle" ? local.bundleProvider : "",
        bundleId: mode === "bundle" ? local.bundleId : "",
        included: mode === "bundle" ? local.included : "",
      });
      resetDraft();
      sessionStorage.setItem("teum:last-sub", JSON.stringify({
        id,
        name: local.name.trim(),
        amount,
        months,
        alert: alertOn,
      }));
      router.replace(fromResult ? "/subscriptions" : "/subscriptions/saved");
    } catch {
      setSaving(false);
      showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
    }
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => { if (fromResult) goResult(); else setLeave(true); }} />
          <h1>{existing ? "구독 수정" : "구독 등록"}</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <p style={{ fontWeight: 800, fontSize: 20, margin: "4px 0 14px" }}>{existing ? "구독 정보를 수정해주세요" : "새 구독 정보를 입력해주세요"}</p>
          {local.fromAi || check ? <div className="cold-bar" style={{ marginBottom: 12 }}>AI 초안입니다. 저장하기 전에는 내 구독에 들어가지 않아요.</div> : null}
          {trialOn ? <p className="field-hint">ⓘ 무료체험의 경우 첫 결제는 결제금액을 0으로 입력해주세요.</p> : null}
          <div className="mode-toggle">
            <button type="button" className={mode === "solo" ? "on" : ""} onClick={() => setMode("solo")}>단독 구독</button>
            <button type="button" className={mode === "bundle" ? "on" : ""} onClick={() => setMode("bundle")}>결합상품에 포함</button>
          </div>
          {mode === "bundle" ? (
            <div className="field">
              <label>제공사 <i className="req">*</i></label>
              <select
                value={local.bundleProvider ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setLocal((p) => ({ ...p, bundleProvider: id, bundleId: "", name: "", included: "" }));
                  setPicked(false);
                }}
              >
                <option value="">제공사를 선택해주세요</option>
                {BUNDLE_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ) : null}
          <div className={`field ${tried && !nameOk ? "err" : ""}`}>
            <label htmlFor="sub-name">서비스명 <i className="req">*</i></label>
            {mode === "bundle" ? (
              <select
                disabled={!local.bundleProvider}
                value={local.bundleId ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const hit = findBundle(id);
                  setLocal((p) => ({
                    ...p,
                    bundleId: id,
                    name: hit?.name ?? "",
                    included: hit?.included ?? "",
                    amount: hit ? String(hit.amount) : p.amount,
                    everyMonths: hit?.everyMonths ?? p.everyMonths,
                    cycle: (hit?.everyMonths ?? p.everyMonths) === 12 ? "yearly" : "monthly",
                  }));
                  setPicked(true);
                }}
              >
                <option value="">{local.bundleProvider ? "결합상품을 선택해주세요" : "제공사를 먼저 선택해주세요"}</option>
                {bundleList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.amount ? ` · ${p.amount.toLocaleString("ko-KR")}원` : ""}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Brand name={known?.name ?? local.name} color={known?.color ?? "#2576f2"} logo="" />
                <input
                  id="sub-name"
                  aria-required="true"
                  aria-invalid={tried && !nameOk}
                  aria-describedby={tried && !nameOk ? "sub-name-err" : undefined}
                  style={{ flex: 1 }}
                  value={local.name}
                  maxLength={30}
                  placeholder="서비스명 입력"
                  onFocus={() => setOpen(true)}
                  onChange={(e) => {
                    setLocal((p) => ({ ...p, name: e.target.value }));
                    setPicked(false);
                    setOpen(true);
                  }}
                />
              </div>
            )}
            {mode === "solo" && open && hits.length > 0 && !picked ? (
              <div className="svc-suggest">
                {hits.map((s) => (
                  <button key={s.name} type="button" onClick={() => pick(s.name)}>
                    <Brand name={s.name} color={s.color} logo={s.logo} />
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
            {tried && !nameOk ? <p id="sub-name-err" className="err-msg">서비스명을 입력해 주세요.</p> : null}
            {mode === "bundle" && local.included ? (
              <p className="field-hint">포함 서비스: {local.included}</p>
            ) : null}
          </div>
          <div className={`field ${tried && !dateOk ? "err" : ""}`}>
            <label htmlFor="sub-pay">첫 결제일 <i className="req">*</i></label>
            <button id="sub-pay" type="button" className="when-chip" aria-required="true" onClick={() => setPayPick(true)}>
              {local.nextPay ? dateLabel(local.nextPay) : "날짜"}
            </button>
          </div>
          <div className="field">
            <label htmlFor="sub-cycle">결제 주기 <i className="req">*</i></label>
            <div className="amt-row">
              <input
                id="sub-cycle"
                aria-required="true"
                inputMode="numeric"
                value={cycleText}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  if (raw === "") {
                    setCycleText("");
                    return;
                  }
                  if (raw === "0") return;
                  const n = Math.min(99, Number(raw));
                  if (!n) return;
                  setCycleText(String(n));
                  setLocal((p) => ({ ...p, everyMonths: n, cycle: (n === 12 ? "yearly" : "monthly") as BillingCycle }));
                }}
              />
              <span>개월</span>
            </div>
            {tried && !cycleOk ? <p className="err-msg">결제 주기는 1~99개월만 입력할 수 있어요.</p> : null}
          </div>
          <div className={`field ${tried && (!amountOk || !amountRangeOk) ? "err" : ""}`}>
            <label htmlFor="sub-amount">{mode === "bundle" ? "결합상품 결제금액" : "결제 금액"} <i className="req">*</i></label>
            <div className="amt-row">
              <input
                id="sub-amount"
                aria-required="true"
                aria-invalid={tried && (!amountOk || !amountRangeOk)}
                aria-describedby={!amountRangeOk ? "sub-amount-err" : undefined}
                inputMode="numeric"
                value={commaWon(local.amount)}
                onChange={(e) => setLocal((p) => ({ ...p, amount: digitsOf(e.target.value) }))}
                placeholder="4,900"
              />
              <span>원</span>
            </div>
            {!amountRangeOk ? (
              <p id="sub-amount-err" className="err-msg">최대 99,999,999원까지 입력할 수 있어요.</p>
            ) : tried && !amountOk ? (
              <p id="sub-amount-err" className="err-msg">결제 금액을 입력해 주세요.</p>
            ) : mode === "solo" && known && local.amount && Number(digitsOf(local.amount)) !== known.amount ? (
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
            <label htmlFor="sub-pay-method">결제 수단</label>
            <input id="sub-pay-method" value={local.payMethod} maxLength={10} onChange={(e) => setLocal((p) => ({ ...p, payMethod: e.target.value }))} placeholder="결제수단의 별칭을 입력해주세요" />
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
            <label htmlFor="sub-memo">메모</label>
            <textarea id="sub-memo" value={local.memo} onChange={(e) => setLocal((p) => ({ ...p, memo: e.target.value }))} placeholder="해지 가능일 · 종료일 · 메모 (선택)" />
          </div>
          <button className="btn primary" type="button" disabled={saving || !amountRangeOk} onClick={() => { setDraft(local); save(); }}>{saving ? "저장 중…" : "저장하기"}</button>
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
        {dup ? (
          <Modal
            title="비슷한 구독이 있어요"
            body={"같은 이름과 금액의 구독이 이미 등록되어 있어요.\n그래도 저장할까요?"}
            cancel="취소"
            confirm="계속 저장"
            onCancel={() => setDup(false)}
            onConfirm={() => { setDup(false); save(true); }}
          />
        ) : null}
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
