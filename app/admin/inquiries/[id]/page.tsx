"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { csDateTime, statusLabel, type Inquiry } from "@/lib/cs";

function Inner({ id }: { id: string }) {
  const sp = useSearchParams();
  const qs = sp.toString();
  const back = qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  const keep = qs ? `?${qs}` : "";
  const [row, setRow] = useState<Inquiry | null>(null);
  const [others, setOthers] = useState<Inquiry[]>([]);
  const [answer, setAnswer] = useState("");
  const [edit, setEdit] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = () => {
    setNote("");
    fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setErr(json.error || "문의를 불러오지 못했습니다.");
          return;
        }
        setRow(json.inquiry);
        setOthers(json.others ?? []);
        setAnswer(json.inquiry.answer_body || "");
        setEdit(!json.inquiry.answer_body);
      })
      .catch(() => setErr("문의를 불러오지 못했습니다."));
  };

  useEffect(() => { load(); }, [id]);

  const save = async (close = false) => {
    if (!row || busy) return;
    if (!close) {
      const text = answer.trim();
      if (text.length < 10 || text.length > 2000) return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(close ? { close: true } : { answer_body: answer.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) {
      setErr(json.error || "답변을 저장하지 못했어요.");
      return;
    }
    setRow(json.inquiry);
    setAnswer(json.inquiry.answer_body || answer);
    setEdit(false);
    setNote(close ? "문의를 종료했어요." : json.inquiry.answered_at && !row.answered_at ? "답변을 등록하고 앱 내 알림을 남겼어요." : "답변을 수정했어요.");
  };

  const canSend = answer.trim().length >= 10 && answer.trim().length <= 2000;

  if (err && !row) return <p className="adm-err">{err}</p>;
  if (!row) return <p>불러오는 중…</p>;

  return (
    <>
      <Link href={back} style={{ display: "inline-block", marginBottom: 12, fontWeight: 700 }}>← CS 문의 목록</Link>
      <div className="adm-head">
        <div>
          <h1>{row.title}</h1>
          <p>{row.category} · {row.email || "-"} · {csDateTime(row.created_at)}</p>
        </div>
        <span className="adm-btn ghost">{statusLabel(row.status)}</span>
      </div>
      <div className="adm-grid2">
        <div>
          <div className="adm-card" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 10px" }}>문의 내용</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{row.body}</p>
            {row.images.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {row.images.map((src, i) => (
                  <a key={src.slice(0, 24) + i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10 }} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="adm-card">
            <h3 style={{ margin: "0 0 10px" }}>답변 작성</h3>
            {row.answer_body && !edit ? (
              <>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{row.answer_body}</p>
                <p style={{ color: "#667085", fontSize: 13 }}>{row.answered_at ? csDateTime(row.answered_at) : ""}</p>
                {row.status !== "CLOSED" ? (
                  <button className="adm-btn" type="button" onClick={() => setEdit(true)}>답변 수정</button>
                ) : null}
              </>
            ) : (
              <>
                <div className="adm-field">
                  <textarea
                    value={answer}
                    maxLength={2000}
                    onChange={(e) => setAnswer(e.target.value.slice(0, 2000))}
                    style={{ height: 160 }}
                    placeholder="사용자에게 전달할 답변을 입력하세요"
                  />
                  <span style={{ fontSize: 12, color: "#667085", textAlign: "right" }}>{answer.length}/2000</span>
                </div>
                {err ? <p className="adm-err">{err}</p> : null}
                {note ? <p style={{ color: "#027a48", fontSize: 13 }}>{note}</p> : null}
                <div className="adm-actions">
                  <button className="adm-btn primary" type="button" disabled={!canSend || busy} onClick={() => void save(false)}>
                    {row.answered_at ? "수정 저장" : "답변 등록 + 푸시 발송"}
                  </button>
                  <button className="adm-btn" type="button" disabled={busy} onClick={() => void save(true)}>문의 종료</button>
                </div>
              </>
            )}
            {row.answer_body && !edit && note ? <p style={{ color: "#027a48", fontSize: 13 }}>{note}</p> : null}
            {row.answer_body && !edit && err ? <p className="adm-err">{err}</p> : null}
          </div>
        </div>
        <div className="adm-card">
          <h3 style={{ margin: "0 0 10px" }}>이 사용자의 다른 문의</h3>
          {others.length === 0 ? <p style={{ color: "#667085", margin: 0 }}>없음</p> : others.map((o) => (
            <Link key={o.id} href={`/admin/inquiries/${o.id}${keep}`} className="adm-item" style={{ textDecoration: "none", color: "inherit" }}>
              <div>
                <b style={{ display: "block" }}>{o.title}</b>
                <span style={{ fontSize: 12, color: "#667085" }}>{csDateTime(o.created_at)} · {statusLabel(o.status)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AdminInquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <Inner id={id} />
    </Suspense>
  );
}
