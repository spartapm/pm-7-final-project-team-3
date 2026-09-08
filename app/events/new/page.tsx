"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { uid, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function EventNew() {
  const router = useRouter();
  const { upsertEvent, showToast } = useStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const [allDay, setAllDay] = useState(false);
  const [memo, setMemo] = useState("");
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back /><h1>일상 일정</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          <div className="field">
            <label>제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="저녁 약속" />
          </div>
          <div className="field">
            <label>날짜</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <label className="check">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            하루 종일
          </label>
          {allDay ? null : (
            <>
              <div className="field"><label>시작</label><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div className="field"><label>종료</label><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            </>
          )}
          <div className="field">
            <label>메모</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              if (!title.trim()) {
                showToast("일정 제목을 입력해 주세요.", "err");
                return;
              }
              upsertEvent({ id: uid("evt"), title: title.trim(), date, start, end, allDay, memo, createdAt: Date.now() });
              showToast("일정이 저장되었습니다.");
              router.replace("/events/saved");
            }}
          >
            저장하기
          </button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
