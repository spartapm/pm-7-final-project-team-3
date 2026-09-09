"use client";

import { useEffect, useRef, useState } from "react";
import { monthGrid, monthLabel, pad, parseYmd } from "@/lib/format";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINS = Array.from({ length: 60 }, (_, i) => i);

export function WhenPick({
  open,
  allDay,
  date,
  time,
  minDate,
  onCancel,
  onPick,
}: {
  open: boolean;
  allDay: boolean;
  date: string;
  time: string;
  minDate?: string;
  onCancel: () => void;
  onPick: (date: string, time: string) => void;
}) {
  const seed = date ? parseYmd(date) : new Date();
  const [cursor, setCursor] = useState(new Date(seed.getFullYear(), seed.getMonth(), 1));
  const [sel, setSel] = useState(date);
  const [step, setStep] = useState<"date" | "time">("date");
  const [hour, setHour] = useState(Number((time || "00:00").slice(0, 2)) || 0);
  const [min, setMin] = useState(Number((time || "00:00").slice(3, 5)) || 0);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const d = date ? parseYmd(date) : new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSel(date);
    setStep("date");
    setHour(Number((time || "00:00").slice(0, 2)) || 0);
    setMin(Number((time || "00:00").slice(3, 5)) || 0);
  }, [open, date, time]);

  useEffect(() => {
    if (step !== "time") return;
    const toOn = (col: HTMLDivElement | null) => {
      const el = col?.querySelector<HTMLElement>(".on");
      if (!col || !el) return;
      col.scrollTop = el.offsetTop - col.clientHeight / 2 + el.clientHeight / 2;
    };
    toOn(hourRef.current);
    toOn(minRef.current);
  }, [step, hour, min]);

  if (!open) return null;
  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());

  const commitTime = (h: number, m: number) => {
    onPick(sel, `${pad(h)}:${pad(m)}`);
  };

  return (
    <div
      className="modal-back when-dim"
      onClick={() => {
        if (step === "time" && sel) commitTime(hour, min);
        else onCancel();
      }}
    >
      <div className="when-sheet" onClick={(e) => e.stopPropagation()}>
        {step === "date" ? (
          <>
            <div className="when-month">
              <button type="button" aria-label="이전 달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
              <strong>{monthLabel(cursor)}</strong>
              <button type="button" aria-label="다음 달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="cal-dow">
              {DOW.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="cal-grid when-grid">
              {cells.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={Boolean(minDate && c.key < minDate)}
                  className={`cal-cell ${c.inMonth ? "" : "out"} ${c.dow === 0 ? "sun" : ""} ${c.dow === 6 ? "sat" : ""} ${sel === c.key ? "on" : ""} ${minDate && c.key < minDate ? "off" : ""}`}
                  onClick={() => {
                    if (minDate && c.key < minDate) return;
                    setSel(c.key);
                    if (allDay) onPick(c.key, time);
                    else setStep("time");
                  }}
                >
                  <span className="d">{c.date}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="time-pick">
            <p className="time-pick-label">{sel.replace(/-/g, ".")}</p>
            <div className="time-cols">
              <div className="time-col" ref={hourRef}>
                {HOURS.map((h) => (
                  <button key={h} type="button" className={h === hour ? "on" : ""} onClick={() => setHour(h)}>
                    {pad(h)}
                  </button>
                ))}
              </div>
              <div className="time-colon">:</div>
              <div className="time-col" ref={minRef}>
                {MINS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={m === min ? "on" : ""}
                    onClick={() => {
                      setMin(m);
                      commitTime(hour, m);
                    }}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
