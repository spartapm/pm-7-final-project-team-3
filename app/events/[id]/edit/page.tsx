"use client";

import { use } from "react";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { EventForm } from "@/components/EventForm";
import { useStore } from "@/lib/store";

export default function EventEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { events } = useStore();
  const ev = events.find((e) => e.id === id);
  if (!ev) {
    return (
      <Gate>
        <PhoneShell>
          <div className="topbar"><Back href="/calendar" /><h1>일정 등록/수정</h1><span style={{ width: 36 }} /></div>
          <div className="scroll"><div className="empty">일정을 찾을 수 없어요.</div></div>
        </PhoneShell>
      </Gate>
    );
  }
  return <EventForm existing={ev} />;
}
