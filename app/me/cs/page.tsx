"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { csDate, ellipsisTitle, type CsStatus, type Inquiry } from "@/lib/cs";
import { useStore } from "@/lib/store";

const FILTERS: { id: "all" | "WAITING" | "ANSWERED"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "WAITING", label: "답변대기" },
  { id: "ANSWERED", label: "답변완료" },
];

function badgeClass(status: CsStatus) {
  if (status === "WAITING") return "cs-badge wait";
  if (status === "CLOSED") return "cs-badge closed";
  return "cs-badge done";
}

export default function CsListPage() {
  const router = useRouter();
  const { accountId, hydrated } = useStore();
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [filter, setFilter] = useState<"all" | "WAITING" | "ANSWERED">("all");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !accountId) return;
    let alive = true;
    fetch(`/api/cs/inquiries?accountId=${encodeURIComponent(accountId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok || !json.ok) {
          router.replace("/error");
          return;
        }
        setRows(json.inquiries ?? []);
      })
      .catch(() => {
        if (alive) router.replace("/error");
      });
    return () => { alive = false; };
  }, [hydrated, accountId, router]);

  const shown = useMemo(() => {
    const list = rows ?? [];
    if (filter === "WAITING") return list.filter((r) => r.status === "WAITING");
    if (filter === "ANSWERED") return list.filter((r) => r.status === "ANSWERED" || r.status === "CLOSED");
    return list;
  }, [rows, filter]);

  const goNew = () => router.push("/me/cs/new");
  const emptyAll = rows !== null && rows.length === 0;

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me/support" /><h1>1:1 문의</h1><span style={{ width: 36 }} /></div>
        <div className="scroll cs-scroll" ref={listRef}>
          {rows === null ? (
            <p className="muted" style={{ textAlign: "center", marginTop: 40 }}>불러오는 중…</p>
          ) : emptyAll ? (
            <div className="cs-empty">
              <h3>아직 보낸 문의가 없어요</h3>
              <p>궁금한 점을 남기면 영업일 기준 1~2일 안에 답변드려요</p>
              <button className="btn primary" type="button" onClick={goNew}>문의하기</button>
            </div>
          ) : (
            <>
              <div className="chip-row cs-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    className={`chip ink ${filter === f.id ? "on" : ""}`}
                    type="button"
                    onClick={() => {
                      setFilter(f.id);
                      listRef.current?.scrollTo({ top: 0 });
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <p className="muted" style={{ textAlign: "center", marginTop: 28 }}>해당 상태의 문의가 없어요</p>
              ) : shown.map((row) => (
                <button
                  key={row.id}
                  className="cs-card"
                  type="button"
                  onClick={() => router.push(`/me/cs/${row.id}`)}
                >
                  {row.status === "ANSWERED" && !row.read_at ? <i className="unread" /> : null}
                  <div className="cs-card-top">
                    <span className="cs-tag">{row.category}</span>
                    <span className={badgeClass(row.status === "CLOSED" ? "ANSWERED" : row.status)}>{row.status === "WAITING" ? "답변대기" : "답변완료"}</span>
                  </div>
                  <strong>{ellipsisTitle(row.title)}</strong>
                  <span className="meta">{csDate(row.created_at)}</span>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="cs-foot">
          <button className="btn primary" type="button" onClick={goNew}>문의하기</button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
