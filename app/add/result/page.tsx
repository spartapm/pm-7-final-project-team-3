"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Brand, Gate, PhoneShell, TabBar } from "@/components/ui";
import { findBrand } from "@/lib/brands";
import { findDuplicate } from "@/lib/dedup";
import { clearExtract, readExtract, removeExtractItem } from "@/lib/extract";
import { dateLabel, uid, won } from "@/lib/format";
import { track, useGaView } from "@/lib/ga";
import { useStore } from "@/lib/store";
import { useBenefits } from "@/lib/use-benefits";
import type { ExtractEventItem, ExtractItem, ExtractState, ExtractSubItem } from "@/lib/types";

function metaOf(item: ExtractItem) {
  if (item.needConfirm) return "확인 필요";
  if (item.kind === "event") {
    const a = item.date ? dateLabel(item.date) : "";
    const b = item.endDate && item.endDate !== item.date ? dateLabel(item.endDate) : "";
    return b ? `${a} ~ ${b}` : a;
  }
  const day = item.day ?? (item.nextPay ? Number(item.nextPay.slice(8, 10)) : null);
  const amt = item.amount ? won(Number(item.amount)) : "";
  if (day && amt) return `매월 ${day}일 · ${amt}`;
  if (day) return `매월 ${day}일`;
  return amt;
}

function Inner() {
  const router = useRouter();
  const q = useSearchParams();
  const kind = q.get("kind") === "event" ? "event" : "subscription";
  const from = q.get("from") === "voice" ? "voice" : "image";
  const { upsertSub, upsertEvent, showToast, subscriptions } = useStore();
  const { soloProducts } = useBenefits();
  const [state, setState] = useState<ExtractState | null>(null);
  const [exit, setExit] = useState(false);
  const [fabTab, setFabTab] = useState("/home");
  const [allowedDup, setAllowedDup] = useState<Set<string>>(new Set());
  const [dupId, setDupId] = useState<string | null>(null);
  const [dupChoice, setDupChoice] = useState<"remove" | "keep" | null>(null);
  const exitRef = useRef(false);
  const dirtyRef = useRef(false);
  useGaView("image_analysis_complete", { registration_target: kind === "event" ? "schedule" : "subscription" }, from === "image" && Boolean(state));
  exitRef.current = exit;
  dirtyRef.current = Boolean(state?.dirty);

  useEffect(() => {
    const sync = () => {
      const cur = readExtract();
      if (cur && cur.kind === kind) {
        setState(cur);
        return true;
      }
      return false;
    };
    if (!sync()) {
      router.replace("/home");
      return;
    }
    const onShow = () => { sync(); };
    setFabTab(sessionStorage.getItem("teum:fab-tab") || "/home");
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("focus", onShow);
    };
  }, [from, kind, router]);

  useEffect(() => {
    history.pushState({ teumResult: 1 }, "");
    const onPop = () => {
      if (exitRef.current) {
        setExit(false);
        history.pushState({ teumResult: 1 }, "");
        return;
      }
      if (dirtyRef.current) {
        setExit(true);
        history.pushState({ teumResult: 1 }, "");
        return;
      }
      clearExtract();
      router.replace("/home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [from, kind, router]);

  const leave = (clear: boolean) => {
    if (clear) clearExtract();
    router.replace("/home");
  };

  const askLeave = () => {
    if (state?.dirty) setExit(true);
    else leave(false);
  };

  const openItem = (item: ExtractItem) => {
    if (item.kind === "subscription") {
      router.push(`/add/confirm?from=result&i=${item.id}`);
    } else {
      router.push(`/events/new?from=result&i=${item.id}`);
    }
  };

  const liveSubs = (subscriptions ?? []).filter((s) => s.status !== "ended");
  const dupMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findDuplicate>>();
    if (!state || kind !== "subscription") return map;
    for (const item of state.items) {
      if (item.kind !== "subscription" || allowedDup.has(item.id)) continue;
      map.set(item.id, findDuplicate(item, liveSubs, soloProducts));
    }
    return map;
  }, [state, kind, liveSubs, allowedDup, soloProducts]);
  const dupCount = [...dupMap.values()].filter(Boolean).length;
  const dupOpen = dupId && state ? state.items.find((x) => x.id === dupId) : null;
  const dupInfo = dupId ? dupMap.get(dupId) : null;

  const applyDup = () => {
    if (!dupId || !dupChoice || !state) return;
    if (dupChoice === "remove") {
      removeExtractItem(dupId);
      setState(readExtract());
    } else {
      setAllowedDup((prev) => new Set(prev).add(dupId));
    }
    setDupId(null);
    setDupChoice(null);
  };

  const direct = () => {
    track("image_manual_entry_select");
    if (kind === "event") {
      router.push("/events/new?from=result&i=new");
      return;
    }
    router.push("/add/confirm?from=result&i=new");
  };

  const saveAll = () => {
    if (!state) return;
    if (kind === "subscription" && dupCount > 0) return;
    const incomplete = state.items.some((item) => (
      item.kind === "event"
        ? !item.title.trim() || !item.date
        : !item.name.trim() || !item.nextPay
    ));
    if (incomplete) {
      showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
      return;
    }
    try {
      if (kind === "event") {
        const events = state.items.filter((x): x is ExtractEventItem => x.kind === "event");
        const ready = events.filter((ev) => ev.title.trim() && ev.date);
        if (ready.length === 0) {
          showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
          return;
        }
        for (const ev of ready) {
          upsertEvent({
            id: uid("evt"),
            title: ev.title.trim(),
            date: ev.date,
            endDate: ev.endDate || ev.date,
            start: ev.start || "00:00",
            end: ev.end || "23:59",
            allDay: Boolean(ev.allDay),
            memo: ev.memo.slice(0, 50),
            createdAt: Date.now(),
            alertMin: ev.alertMin,
          });
        }
        clearExtract();
        router.replace("/calendar");
        track("schedule_add_complete", { registration_method: from });
        return;
      }
      const subs = state.items.filter((x): x is ExtractSubItem => x.kind === "subscription");
      const ready = subs.filter((s) => s.name.trim() && s.nextPay);
      if (ready.length === 0) {
        showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
        return;
      }
      for (const s of ready) {
        const known = findBrand(s.name);
        const id = uid("sub");
        const amount = Number(s.amount) || 0;
        upsertSub({
          id,
          name: s.name.trim(),
          plan: s.plan,
          category: known?.category ?? s.category,
          amount,
          cycle: s.cycle,
          payDay: s.day ?? (s.nextPay ? Number(s.nextPay.slice(8, 10)) : 1),
          nextPay: s.nextPay,
          status: s.status === "trial" ? "trial" : "active",
          autoRenew: true,
          unused: false,
          memo: s.memo,
          color: known?.color ?? "#2576f2",
          logo: "",
          trialEnds: null,
          paused: false,
          alertDays: s.alertDays,
          createdAt: Date.now(),
          payMethod: s.payMethod,
        });
        sessionStorage.setItem("teum:last-sub", JSON.stringify({
          id,
          name: s.name.trim(),
          amount,
          cycle: s.cycle,
          alert: s.alertDays > 0,
        }));
      }
      clearExtract();
      router.replace("/subscriptions");
      track("subscription_add_complete", { registration_method: from });
    } catch {
      showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
      track(kind === "event" ? "schedule_add_failed" : "subscription_add_failed", { registration_method: from });
    }
  };

  if (!state) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar"><Back onClick={() => leave(false)} /><h1>추출 결과</h1><span style={{ width: 36 }} /></div>
          <div className="scroll" />
        </PhoneShell>
      </Gate>
    );
  }

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={askLeave} />
          <h1>추출 결과</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll tabbed result-page">
          <h2>{kind === "event" ? "일정을 확인해주세요" : "구독을 확인해주세요"}</h2>
          {kind === "subscription" && dupCount > 0 ? (
            <p className="muted">이미 등록된 구독 {dupCount}건을 찾았어요. 저장 전에 처리해주세요.</p>
          ) : (
            <p className="muted">중복 항목을 확인하고 저장 전 내용을 수정할 수 있어요.</p>
          )}
          <div className="result-list">
            {state.items.map((item) => {
              const known = item.kind === "subscription" ? findBrand(item.name) : null;
              const label = item.kind === "event" ? item.title : item.name;
              const dup = item.kind === "subscription" ? dupMap.get(item.id) : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="result-card"
                  onClick={() => {
                    track("image_result_item_select", { duplicate_status: dup ? "duplicate" : "unique" });
                    if (dup) {
                      setDupChoice(null);
                      setDupId(item.id);
                      return;
                    }
                    openItem(item);
                  }}
                >
                  {item.kind === "subscription" ? (
                    <Brand name={known?.name ?? item.name} color={known?.color ?? "#2576f2"} logo="" />
                  ) : (
                    <span className="brand" style={{ background: "#ff7aa2" }}>{label.slice(0, 1) || "·"}</span>
                  )}
                  <span className="result-card-body">
                    <b>{label || "이름 없음"}</b>
                    <em>{metaOf(item)}</em>
                  </span>
                  {dup ? <span className="dup-badge">중복</span> : null}
                  <span className="result-chevron">›</span>
                </button>
              );
            })}
          </div>
          {kind === "subscription" && dupCount > 0 ? (
            <p className="result-hint">중복 항목을 탭하면 처리 방법을 고를 수 있어요.</p>
          ) : null}
          <div className="result-manual">
            <p>{kind === "event" ? "원하는 일정이 목록에 없나요?" : "원하는 서비스가 목록에 없나요?"}</p>
            <button type="button" onClick={direct}>
              <img src="/teumki/doochit.png" alt="" />
              직접 입력하기
            </button>
          </div>
          <button
            className="btn primary"
            type="button"
            disabled={state.items.length === 0 || (kind === "subscription" && dupCount > 0)}
            onClick={saveAll}
          >
            {kind === "subscription" && dupCount > 0 ? `저장하기 (중복 ${dupCount}건 처리 필요)` : "저장하기"}
          </button>
        </div>
        <TabBar active={fabTab} />
        {dupOpen && dupOpen.kind === "subscription" && dupInfo ? (
          <>
            <div className="sheet-back" onClick={() => { setDupId(null); setDupChoice(null); }} />
            <div className="sheet">
              <h2>{dupOpen.name}, 이미 등록돼 있어요</h2>
              <p className="muted">동일한 구독 서비스가 감지되었어요. 어떻게 처리할까요?</p>
              <div className="dup-compare">
                <div><span className="k">기존</span><b>{dupInfo.existingProductName}</b></div>
                <div><span className="k">추가</span><b className="add">{dupOpen.name}</b></div>
              </div>
              <button type="button" className={`dup-radio ${dupChoice === "remove" ? "on" : ""}`} onClick={() => setDupChoice("remove")}>
                <i />
                <b>중복 결과 제거하기</b>
                <span>추출된 결과에서 이 구독 서비스를 제거해요.</span>
              </button>
              <button type="button" className={`dup-radio ${dupChoice === "keep" ? "on" : ""}`} onClick={() => setDupChoice("keep")}>
                <i />
                <b>중복 등록하기</b>
                <span>기존 구독과 동일한 구독을 중복으로 추가해요.</span>
              </button>
              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button className="btn cancel" type="button" onClick={() => { setDupId(null); setDupChoice(null); }}>취소</button>
                <button className="btn primary" type="button" disabled={!dupChoice} onClick={applyDup}>적용하고 계속</button>
              </div>
            </div>
          </>
        ) : null}
        {exit ? (
          <div className="modal-back">
            <div className="modal">
              <img className="modal-mascot" src="/teumki/curious.png" alt="" />
              <h3>추출 결과를 닫을까요?</h3>
              <p>추출 결과와 수정된 내용은 저장되지 않아요.</p>
              <div className="modal-actions">
                <button className="btn cancel" type="button" onClick={() => setExit(false)}>계속 확인하기</button>
                <button className="btn primary" type="button" onClick={() => leave(true)}>나가기</button>
              </div>
            </div>
          </div>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

export default function AddResultPage() {
  return <Suspense><Inner /></Suspense>;
}
