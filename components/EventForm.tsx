"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { pad, uid, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { LifeEvent } from "@/lib/types";

const ALERTS = [
  { min: 5, label: "5분전" },
  { min: 10, label: "10분 전" },
  { min: 15, label: "15분 전" },
  { min: 30, label: "30분 전" },
  { min: 60, label: "1시간 전" },
];

function hmNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function hmPlus(hm: string, mins: number) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, (m || 0) + mins, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ existing }: { existing: LifeEvent | null }) {
  const router = useRouter();
  const { upsertEvent, showToast, draft } = useStore();
  const startDefault = existing?.start || hmNow();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? ymd(new Date()));
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(existing?.end || hmPlus(startDefault, 60));
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [alertMin, setAlertMin] = useState(existing?.alertMin ?? 30);
  const [fromAi, setFromAi] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (existing) return;
    try {
      const raw = sessionStorage.getItem("teum:ai-event");
      if (raw) {
        const v = JSON.parse(raw) as { title?: string; date?: string; start?: string; end?: string };
        if (v.title) setTitle(v.title.slice(0, 30));
        if (v.date) setDate(v.date);
        if (v.start) setStart(v.start);
        if (v.end) setEnd(v.end);
        setFromAi(true);
        sessionStorage.removeItem("teum:ai-event");
        return;
      }
    } catch {
      /* ignore */
    }
    if (draft.fromAi && draft.name) {
      setTitle(draft.name.slice(0, 30));
      setFromAi(true);
    }
  }, [draft.fromAi, draft.name, existing]);

  const nameOk = title.trim().length >= 1 && title.trim().length <= 30 && title.trim().toUpperCase() !== "NULL";
  const timeOk = allDay || `${date}T${start}` < `${date}T${end}`;
  const canSave = nameOk && timeOk;

  const save = () => {
    setTried(true);
    if (!nameOk) {
      showToast("일정 이름은 필수 항목이에요.", "err");
      return;
    }
    if (!timeOk) {
      showToast("종료 시간은 시작 시간보다 늦어야 해요", "err");
      return;
    }
    if (!canSave) {
      showToast("필수 항목을 전부 작성해주세요.", "err");
      return;
    }
    try {
      upsertEvent({
        id: existing?.id ?? uid("evt"),
        title: title.trim(),
        date,
        start,
        end,
        allDay,
        memo: memo.slice(0, 50),
        createdAt: existing?.createdAt ?? Date.now(),
        alertMin,
      });
      router.replace("/events/saved");
    } catch {
      showToast("저장에 실패했습니다. 잠시 후 다시 시도해주세요.", "err");
    }
  };

  const alertLabel = useMemo(() => ALERTS.find((a) => a.min === alertMin)?.label ?? "30분 전", [alertMin]);

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back href="/calendar" />
          <h1>일정 등록/수정</h1>
          <span style={{ width: 36 }} />
        </div>
        <div className="scroll">
          {fromAi ? <div className="cold-bar" style={{ marginBottom: 12 }}>⚠️ 분석 결과를 확인한 뒤 저장해야 반영돼요.</div> : null}
          <div className={`field ${tried && !nameOk ? "err" : ""}`}>
            <label>일정 이름 <i className="req">*</i></label>
            <input
              value={title}
              maxLength={30}
              placeholder="일정 이름을 입력해주세요"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {tried && !nameOk ? <p className="err-msg">일정 이름은 필수 항목이에요.</p> : null}
          <div className="field">
            <label>일시 <i className="req">*</i></label>
            <label className="check" style={{ alignItems: "center", margin: "0 0 10px" }}>
              <span className="grow">하루 종일</span>
              <button className={`switch ${allDay ? "on" : ""}`} type="button" aria-label="하루 종일" onClick={() => setAllDay((v) => !v)}><i /></button>
            </label>
            <div className="when-row">
              <span>시작</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {allDay ? null : <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />}
            </div>
            <div className={`when-row ${tried && !timeOk ? "bad" : ""}`}>
              <span>종료</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {allDay ? null : <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />}
            </div>
          </div>
          {tried && !timeOk ? <p className="err-msg">종료 시간은 시작 시간보다 늦어야 해요</p> : null}
          <div className="field">
            <label>알림</label>
            <select value={alertMin} onChange={(e) => setAlertMin(Number(e.target.value))}>
              {ALERTS.map((a) => <option key={a.min} value={a.min}>{a.label}</option>)}
            </select>
            <p className="field-hint">{alertLabel}</p>
          </div>
          <div className="field">
            <label>메모</label>
            <textarea
              value={memo}
              maxLength={50}
              placeholder="상세 사항을 메모해주세요. (최대 50자)"
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <button className="btn primary" type="button" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.4 }} onClick={save}>저장하기</button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
