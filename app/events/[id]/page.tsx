"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Back, Gate, Modal, PhoneShell } from "@/components/ui";
import { dateLabel, timeLabel, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { events, removeEvent } = useStore();
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
  const done = ev.date < ymd(new Date());
  const when = ev.allDay
    ? `${dateLabel(ev.date)} · 하루 종일`
    : `${dateLabel(ev.date)} ${timeLabel(ev.start)} ~ ${dateLabel(ev.endDate || ev.date)} ${timeLabel(ev.end)}`;
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/calendar" /><h1>일정 상세</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800 }}>{ev.title}</h2>
              {done ? <span className="pill">완료</span> : null}
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <span className="muted">일시</span>
              <span className="grow" style={{ textAlign: "right", fontWeight: 700 }}>{when}</span>
            </div>
            <div className="row">
              <span className="muted">알림</span>
              <span className="grow" style={{ textAlign: "right", fontWeight: 700 }}>30분 전</span>
            </div>
          </div>
          <img className="alert-banner" src="/banners/alarm.png" alt="일정 30분 전에 알려드려요. 놓치지 않도록 미리 준비해보세요." />
          <div className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontWeight: 700, marginBottom: 8 }}>메모</div>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{ev.memo || "작성된 메모가 없어요."}</p>
          </div>
          <div className="section-title" style={{ marginTop: 16 }}>관리</div>
          <button className="btn primary" type="button" onClick={() => router.push(`/events/${ev.id}/edit`)}>정보 수정</button>
          <div style={{ height: 8 }} />
          <button className="btn danger" type="button" onClick={() => setDel(true)}>삭제</button>
        </div>
        {del ? (
          <Modal
            title="이 일정을 삭제하시겠어요?"
            body="삭제하면 복구할 수 없어요"
            confirm="삭제"
            danger
            mascot="/teumki/shock.png"
            onCancel={() => setDel(false)}
            onConfirm={() => {
              removeEvent(ev.id);
              router.replace(`/calendar?date=${ev.date}`);
            }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
