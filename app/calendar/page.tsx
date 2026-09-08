"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fab, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BENEFITS } from "@/lib/catalog";
import { dateLabel, fullDateLabel, monthGrid, monthLabel, timeLabel, won, ymd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { CalendarFilter } from "@/lib/types";

type CalItem = { type: "sub" | "life" | "benefit"; title: string; right: string; href: string; color: string };

function Inner() {
  const router = useRouter();
  const q = useSearchParams().get("date");
  const { subscriptions, events, showToast } = useStore();
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [sel, setSel] = useState(q ?? ymd(now));
  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const live = subscriptions.filter((s) => s.status !== "ended" && !s.paused);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    const add = (key: string, item: CalItem) => {
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    };
    if (filter !== "life") {
      for (const s of live) {
        add(s.nextPay, {
          type: "sub",
          title: s.autoRenew ? `${s.name} 갱신` : `${s.name} 결제`,
          right: won(s.amount),
          href: `/subscriptions/${s.id}`,
          color: "#2576f2",
        });
        if (s.trialEnds && s.trialEnds !== s.nextPay) {
          add(s.trialEnds, {
            type: "sub",
            title: `${s.name} 무료체험 종료`,
            right: dateLabel(s.trialEnds),
            href: `/subscriptions/${s.id}`,
            color: "#ff7700",
          });
        }
      }
    }
    if (filter === "all") {
      for (const b of BENEFITS) {
        if (!b.expires) continue;
        add(b.expires, {
          type: "benefit",
          title: `${b.provider} 혜택 만료`,
          right: b.title,
          href: `/benefits/${b.id}`,
          color: "#f0a202",
        });
      }
    }
    if (filter !== "sub") {
      for (const e of events) add(e.date, { type: "life", title: e.title, right: e.allDay ? "하루 종일" : timeLabel(e.start), href: `/events/${e.id}`, color: "#ff7aa2" });
    }
    return map;
  }, [live, events, filter]);

  const todayCount = (itemsByDay.get(ymd(now)) ?? []).length;
  const monthCount = [...itemsByDay.keys()].filter((k) => k.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)).reduce((a, k) => a + (itemsByDay.get(k)?.length ?? 0), 0);
  const selected = itemsByDay.get(sel) ?? [];

  return (
    <Gate>
      <PhoneShell>
        <div className="scroll tabbed">
          <div className="cal-head">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h1>{monthLabel(cursor)}</h1>
              <button
                className="cal-share"
                type="button"
                onClick={async () => {
                  const lines = [`틈 캘린더 · ${monthLabel(cursor)}`, `전체 ${monthCount}개 · 오늘 ${todayCount}개`];
                  for (const [day, items] of [...itemsByDay.entries()].sort()) {
                    if (!day.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)) continue;
                    lines.push(`${day} ${items.map((it) => it.title).join(", ")}`);
                  }
                  const text = lines.join("\n");
                  if (navigator.share) {
                    await navigator.share({ title: "틈 캘린더", text }).catch(() => undefined);
                  } else {
                    await navigator.clipboard.writeText(text).catch(() => undefined);
                    showToast("이번 달 일정을 복사했어요.");
                  }
                }}
              >
                공유
              </button>
            </div>
            <p>{filter === "all" ? "전체" : filter === "sub" ? "구독" : "일상"} 일정 {monthCount}개 · 오늘 {todayCount}개</p>
            <div className="chip-row">
              <button className={`chip ${filter === "sub" ? "on" : ""}`} type="button" onClick={() => setFilter("sub")}><i className="dot sub" />구독</button>
              <button className={`chip ${filter === "life" ? "on" : ""}`} type="button" onClick={() => setFilter("life")}><i className="dot life" />일상</button>
              <button className={`chip ${filter === "all" ? "on" : ""}`} type="button" onClick={() => setFilter("all")}><i className="dot" style={{ background: filter === "all" ? "#fff" : "#9aa3b2" }} />전체</button>
            </div>
          </div>
          <div className="cal-wrap">
            <button className="cal-nav" type="button" aria-label="이전달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
            <div className="cal-card">
              <div className="cal-dow">{["일", "월", "화", "수", "목", "금", "토"].map((d) => <span key={d}>{d}</span>)}</div>
              <div className="cal-grid">
                {cells.map((c) => {
                  const items = itemsByDay.get(c.key) ?? [];
                  return (
                    <button
                      key={c.key}
                      type="button"
                      className={`cal-cell ${c.inMonth ? "" : "out"} ${c.dow === 0 ? "sun" : ""} ${c.dow === 6 ? "sat" : ""} ${sel === c.key ? "on" : ""}`}
                      onClick={() => setSel(c.key)}
                    >
                      <span className="d">{c.date}</span>
                      <span className="marks">
                        {items.slice(0, 3).map((it, i) => <i key={i} style={{ background: it.color }} />)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="cal-nav" type="button" aria-label="다음달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="day-card">
            <h3>
              {fullDateLabel(sel)}
              <span className="pill">{selected.length}개 일정</span>
            </h3>
            {selected.length === 0 ? (
              <div className="empty" style={{ marginTop: 12, background: "transparent" }}>{sel === ymd(now) ? "오늘 일정이 없어요" : "이 날 일정이 없어요"}</div>
            ) : selected.map((it, i) => (
              <button key={i} className="row" type="button" onClick={() => router.push(it.href)} style={{ width: "100%", textAlign: "left" }}>
                <i className="dot" style={{ background: it.color }} />
                <span className="grow" style={{ fontWeight: 700 }}>{it.title}</span>
                <span className="muted">{it.right}</span>
              </button>
            ))}
          </div>
        </div>
        <Fab />
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}

export default function CalendarPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
