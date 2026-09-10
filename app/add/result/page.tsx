"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Brand, Gate, PhoneShell } from "@/components/ui";
import { findBrand } from "@/lib/brands";
import { clearExtract, readExtract } from "@/lib/extract";
import { dateLabel, uid, won } from "@/lib/format";
import { useStore } from "@/lib/store";
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
  const { upsertSub, upsertEvent, showToast } = useStore();
  const [state, setState] = useState<ExtractState | null>(null);
  const [exit, setExit] = useState(false);
  const exitRef = useRef(false);
  const dirtyRef = useRef(false);
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
      router.replace(from === "voice" ? `/add/voice?kind=${kind}` : `/add/image?kind=${kind}`);
      return;
    }
    const onShow = () => { sync(); };
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
      router.replace(from === "voice" ? `/add/voice?kind=${kind}` : `/add/image?kind=${kind}`);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [from, kind, router]);

  const leave = (clear: boolean) => {
    if (clear) clearExtract();
    router.replace(from === "voice" ? `/add/voice?kind=${kind}` : `/add/image?kind=${kind}`);
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

  const direct = () => {
    if (kind === "event") {
      router.push("/events/new?from=result&i=new");
      return;
    }
    router.push("/add/confirm?from=result&i=new");
  };

  const saveAll = () => {
    if (!state) return;
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
            allDay: ev.allDay || !ev.start,
            memo: ev.memo.slice(0, 50),
            createdAt: Date.now(),
            alertMin: ev.alertMin,
          });
        }
        clearExtract();
        router.replace("/events/saved");
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
      router.replace("/subscriptions/saved");
    } catch {
      showToast("⚠️ 저장에 실패했어요. 다시 시도해주세요.", "err");
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
        <div className="scroll result-page">
          <h2>{kind === "event" ? "일정을 확인해주세요" : "구독을 확인해주세요"}</h2>
          <p className="muted">중복 항목을 확인하고 저장 전 내용을 수정할 수 있어요.</p>
          <div className="result-list">
            {state.items.map((item) => {
              const known = item.kind === "subscription" ? findBrand(item.name) : null;
              const label = item.kind === "event" ? item.title : item.name;
              return (
                <button key={item.id} type="button" className="result-card" onClick={() => openItem(item)}>
                  {item.kind === "subscription" ? (
                    <Brand name={known?.name ?? item.name} color={known?.color ?? "#2576f2"} logo={item.name.slice(0, 1)} />
                  ) : (
                    <span className="brand" style={{ background: "#ff7aa2" }}>{label.slice(0, 1) || "·"}</span>
                  )}
                  <span className="result-card-body">
                    <b>{label || "이름 없음"}</b>
                    <em>{metaOf(item)}</em>
                  </span>
                  <span className="result-chevron">›</span>
                </button>
              );
            })}
          </div>
          <div className="result-manual">
            <p>{kind === "event" ? "원하는 일정이 목록에 없나요?" : "원하는 서비스가 목록에 없나요?"}</p>
            <button type="button" onClick={direct}>
              <img src="/teumki/doochit.png" alt="" />
              직접 입력하기
            </button>
          </div>
          <button className="btn primary" type="button" disabled={state.items.length === 0} onClick={saveAll}>저장하기</button>
        </div>
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
