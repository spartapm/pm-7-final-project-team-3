"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Back, Gate, Modal, PhoneShell } from "@/components/ui";
import { dateLabel, timeLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { events, removeEvent, showToast } = useStore();
  const ev = events.find((e) => e.id === id);
  const [del, setDel] = useState(false);
  if (!ev) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar"><Back href="/calendar" /><h1>일정 상세</h1><span style={{ width: 36 }} /></div>
          <div className="scroll"><div className="empty">일정을 찾을 수 없어요.</div></div>
        </PhoneShell>
      </Gate>
    );
  }
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/calendar" /><h1>일정 상세</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          <div className="card">
            <h2 style={{ margin: "0 0 8px" }}>{ev.title}</h2>
            <p className="muted">{dateLabel(ev.date)} · {ev.allDay ? "하루 종일" : `${timeLabel(ev.start)} ~ ${timeLabel(ev.end)}`}</p>
            {ev.memo ? <p style={{ marginTop: 12 }}>{ev.memo}</p> : null}
          </div>
          <div style={{ height: 16 }} />
          <button className="btn primary" type="button" onClick={() => router.push(`/events/${ev.id}/edit`)}>정보 수정</button>
          <div style={{ height: 8 }} />
          <button className="btn danger" type="button" onClick={() => setDel(true)}>삭제</button>
        </div>
        {del ? (
          <Modal
            title="일정을 삭제할까요?"
            body="삭제하면 캘린더에서 사라집니다."
            confirm="삭제"
            danger
            onCancel={() => setDel(false)}
            onConfirm={() => {
              removeEvent(ev.id);
              showToast("일정이 삭제되었습니다.");
              router.replace("/calendar");
            }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
