"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CS_CATEGORIES, csDateTime, statusLabel, type CsStatus, type Inquiry } from "@/lib/cs";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [err, setErr] = useState("");
  const qs = sp.toString();

  const load = (next?: { status?: string; category?: string; q?: string }) => {
    const s = next?.status ?? status;
    const c = next?.category ?? category;
    const query = next?.q ?? q;
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (c) params.set("category", c);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.replace(qs ? `/admin/inquiries?${qs}` : "/admin/inquiries");
    setErr("");
    setRows(null);
    fetch(`/api/admin/inquiries${qs ? `?${qs}` : ""}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setErr(json.error || "목록을 불러오지 못했습니다");
          setRows([]);
          return;
        }
        setWaiting(json.waiting ?? 0);
        setRows(json.inquiries ?? []);
      })
      .catch(() => {
        setErr("목록을 불러오지 못했습니다");
        setRows([]);
      });
  };

  useEffect(() => {
    load();
    // initial only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>CS 문의</h1>
          <p>답변을 등록하면 사용자 앱에 즉시 표시됩니다.</p>
        </div>
        <div className="adm-wait-count">답변 대기 <b>{waiting}</b>건</div>
      </div>
      <form
        className="adm-card"
        style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}
        onSubmit={(e) => { e.preventDefault(); load(); }}
      >
        <div className="adm-field" style={{ margin: 0 }}>
          <label>상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="WAITING">답변대기</option>
            <option value="ANSWERED">답변완료</option>
            <option value="CLOSED">종료</option>
          </select>
        </div>
        <div className="adm-field" style={{ margin: 0 }}>
          <label>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            {CS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="adm-field" style={{ margin: 0, minWidth: 220 }}>
          <label>제목 검색</label>
          <input value={q} placeholder="제목으로 검색" onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="adm-btn primary" type="submit">조회</button>
      </form>
      <div className="adm-card">
        {err ? <p className="adm-err">{err}</p> : null}
        {rows === null ? <p>불러오는 중…</p> : rows.length === 0 && !err ? (
          <p style={{ color: "#667085", margin: 0 }}>조건에 맞는 문의가 없습니다</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>등록일</th>
                <th>카테고리</th>
                <th>제목</th>
                <th>문의자</th>
                <th>상태</th>
                <th>답변일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{csDateTime(r.created_at)}</td>
                  <td>{r.category}</td>
                  <td><Link href={`/admin/inquiries/${r.id}${qs ? `?${qs}` : ""}`}>{r.title}</Link></td>
                  <td>{r.email || "-"}</td>
                  <td>{adminStatus(r.status)}</td>
                  <td>{r.answered_at ? csDateTime(r.answered_at) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function adminStatus(status: CsStatus) {
  if (status === "CLOSED") return "답변 완료 (CLOSED)";
  return statusLabel(status);
}

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <Inner />
    </Suspense>
  );
}
