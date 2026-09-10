"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WhenPick } from "@/components/WhenPick";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { eventItemFromForm, readExtract, upsertExtractItem } from "@/lib/extract";
import { dateLabel, pad, parseYmd, timeLabel, uid, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ExtractEventItem, LifeEvent } from "@/lib/types";

function hmNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shiftHm(date: string, hm: string, mins: number) {
  const [h, m] = hm.split(":").map(Number);
  const d = date ? parseYmd(date) : new Date();
  d.setHours(h || 0, (m || 0) + mins, 0, 0);
  return { date: ymd(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

export function EventForm({
  existing,
  fromResult = false,
  extractId = null,
}: {
  existing: LifeEvent | null;
  fromResult?: boolean;
  extractId?: string | null;
}) {
  const router = useRouter();
  const { upsertEvent, showToast, draft } = useStore();
  const startDefault = existing?.start || (fromResult ? "" : hmNow());
  const dateDefault = existing?.date ?? (fromResult ? "" : ymd(new Date()));
  const endShift = !existing && !fromResult && startDefault
    ? shiftHm(dateDefault, startDefault, 60)
    : null;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(dateDefault);
  const [endDate, setEndDate] = useState(existing?.endDate ?? existing?.date ?? endShift?.date ?? dateDefault);
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(existing?.end || (fromResult ? "" : endShift?.time ?? ""));
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [alertMin, setAlertMin] = useState(30);
  const [fromAi, setFromAi] = useState(fromResult);
  const [tried, setTried] = useState(false);
  const [pick, setPick] = useState<null | "start" | "end">(null);

  useEffect(() => {
    if (existing) return;
    if (fromResult && extractId) {
      const cur = readExtract();
      const item = cur?.items.find((x): x is ExtractEventItem => x.id === extractId && x.kind === "event");
      if (item) {
        setTitle(item.title);
        setDate(item.date);
        setEndDate(item.endDate || item.date);
        setStart(item.start);
        setEnd(item.end);
        setAllDay(item.allDay);
        setMemo(item.memo);
        setAlertMin(30);
        setFromAi(true);
      }
      return;
    }
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
  }, [draft.fromAi, draft.name, existing, extractId, fromResult]);

  const nameOk = title.trim().length >= 1 && title.trim().length <= 30 && title.trim().toUpperCase() !== "NULL";
  const endD = endDate || date;
  const timeOk = Boolean(date) && Boolean(endD) && (allDay
    ? `${date}T00:00` <= `${endD}T23:59`
    : Boolean(start) && Boolean(end) && `${date}T${start}` < `${endD}T${end}`);
  const canSave = nameOk && timeOk;

  const back = () => {
    if (fromResult) {
      const cur = readExtract();
      router.replace(`/add/result?kind=event&from=${cur?.from ?? "image"}`);
      return;
    }
    router.push("/calendar");
  };

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
    if (fromResult) {
      const id = extractId && extractId !== "new" ? extractId : uid("ex");
      upsertExtractItem(eventItemFromForm(id, {
        title, date, endDate: endD, start, end, allDay, memo: memo.slice(0, 50), alertMin,
      }));
      const cur = readExtract();
      router.replace(`/add/result?kind=event&from=${cur?.from ?? "image"}`);
      return;
    }
    try {
      upsertEvent({
        id: existing?.id ?? uid("evt"),
        title: title.trim(),
        date,
        endDate: endD,
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

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={back} />
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
              <button className={`switch ${allDay ? "on" : ""}`} type="button" aria-label="하루 종일" onClick={() => {
                setAllDay((v) => {
                  const next = !v;
                  if (!next) {
                    const now = hmNow();
                    const from = start || now;
                    const shifted = shiftHm(date || ymd(new Date()), from, 60);
                    if (!start) setStart(now);
                    if (!end) {
                      setEnd(shifted.time);
                      if (!endDate) setEndDate(shifted.date);
                    }
                  }
                  return next;
                });
              }}><i /></button>
            </label>
            <div className={`when-row ${allDay ? "allday" : ""} ${!timeOk && date && endD ? "bad" : ""}`}>
              <span>시작</span>
              <button type="button" className="when-chip" onClick={() => setPick("start")}>
                {date ? dateLabel(date) : "날짜"}
              </button>
              {allDay ? null : (
                <button type="button" className="when-chip" onClick={() => setPick("start")}>
                  {start ? timeLabel(start) : "시간"}
                </button>
              )}
            </div>
            <div className={`when-row ${allDay ? "allday" : ""} ${!timeOk && date && endD ? "bad" : ""}`}>
              <span>종료</span>
              <button type="button" className={`when-chip ${!timeOk && date && endD ? "bad" : ""}`} onClick={() => setPick("end")}>
                {endD ? dateLabel(endD) : "날짜"}
              </button>
              {allDay ? null : (
                <button type="button" className={`when-chip ${!timeOk && date && endD ? "bad" : ""}`} onClick={() => setPick("end")}>
                  {end ? timeLabel(end) : "시간"}
                </button>
              )}
            </div>
          </div>
          {!timeOk && date && endD ? <p className="err-msg">종료 시간은 시작 시간보다 늦어야 해요</p> : null}
          <div className="field">
            <label>알림</label>
            <div className="when-chip" style={{ pointerEvents: "none" }}>30분 전</div>
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
        <WhenPick
          open={pick !== null}
          allDay={allDay}
          date={pick === "end" ? (endD || date) : date}
          time={pick === "end" ? end : start}
          onCancel={() => setPick(null)}
          onPick={(nextDate, nextTime) => {
            if (pick === "end") {
              setEndDate(nextDate);
              if (!allDay) setEnd(nextTime);
            } else {
              setDate(nextDate);
              if (!endDate) setEndDate(nextDate);
              if (!allDay) {
                setStart(nextTime);
                if (!end) {
                  const shifted = shiftHm(nextDate, nextTime, 60);
                  setEnd(shifted.time);
                  if (!endDate) setEndDate(shifted.date);
                }
              }
            }
            setPick(null);
          }}
        />
      </PhoneShell>
    </Gate>
  );
}
