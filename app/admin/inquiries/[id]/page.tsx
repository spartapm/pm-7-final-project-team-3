"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { csDateTime, statusLabel, type Inquiry } from "@/lib/cs";

function Inner({ id }: { id: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const qs = sp.toString();
  const back = qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  const keep = qs ? `?${qs}` : "";
  const [row, setRow] = useState<Inquiry | null>(null);
  const [others, setOthers] = useState<Inquiry[]>([]);
  const [answer, setAnswer] = useState("");
  const [edit, setEdit] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [popup, setPopup] = useState(false);

  const load = () => {
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

  const save = async () => {
    if (!row || busy) return;
    const text = answer.trim();
    if (text.length < 10 || text.length > 2000) return;
    setBusy(true);
    setErr("");
    const first = !row.answered_at;
    const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_body: text }),
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
    if (first) setPopup(true);
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
                <button className="adm-btn" type="button" onClick={() => setEdit(true)}>답변 수정</button>
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
                <div className="adm-actions">
                  <button className="adm-btn primary" type="button" disabled={!canSend || busy} onClick={() => void save()}>
                    {row.answered_at ? "수정 저장" : "답변 등록 + 푸시 발송"}
                  </button>
                </div>
              </>
            )}
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
      {popup ? (
        <div className="adm-modal-bg">
          <div className="adm-modal" style={{ textAlign: "center" }}>
            <h2>답변이 등록되었습니다.</h2>
            <p>사용자 앱에 알림이 전달됩니다.</p>
            <button className="adm-btn primary" type="button" onClick={() => { setPopup(false); router.push(back); }}>닫기</button>
          </div>
        </div>
      ) : null}
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
