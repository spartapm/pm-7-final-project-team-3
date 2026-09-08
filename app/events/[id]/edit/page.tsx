"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function EventEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { events, upsertEvent, showToast } = useStore();
  const ev = events.find((e) => e.id === id);
  const [title, setTitle] = useState(ev?.title ?? "");
  const [date, setDate] = useState(ev?.date ?? "");
  const [start, setStart] = useState(ev?.start || "19:00");
  const [end, setEnd] = useState(ev?.end || "21:00");
  const [allDay, setAllDay] = useState(ev?.allDay ?? false);
  const [memo, setMemo] = useState(ev?.memo ?? "");
  if (!ev) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar"><Back href="/calendar" /><h1>일정 수정</h1><span style={{ width: 36 }} /></div>
          <div className="scroll"><div className="empty">일정을 찾을 수 없어요.</div></div>
        </PhoneShell>
      </Gate>
    );
  }
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back /><h1>일상 일정 수정</h1><span style={{ width: 36 }} /></div>
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
              upsertEvent({ ...ev, title: title.trim(), date, start, end, allDay, memo });
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
