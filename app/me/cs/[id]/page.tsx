"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { canDeleteInquiry, csDateTime, extraInquiryTitle, statusLabel, type Inquiry } from "@/lib/cs";
import { useStore } from "@/lib/store";

export default function CsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accountId, hydrated, markNotice, showToast } = useStore();
  const [row, setRow] = useState<Inquiry | null | undefined>(undefined);
  const [view, setView] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated || !accountId) return;
    let alive = true;
    fetch(`/api/cs/inquiries/${encodeURIComponent(id)}?accountId=${encodeURIComponent(accountId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.status === 404 || json.error === "삭제된 문의예요") {
          showToast("삭제된 문의예요", "info");
          router.replace("/me/cs");
          return;
        }
        if (!res.ok || !json.ok) {
          router.replace("/error");
          return;
        }
        setRow(json.inquiry);
      })
      .catch(() => {
        if (alive) router.replace("/error");
      });
    return () => { alive = false; };
  }, [hydrated, accountId, id, router, showToast]);

  useEffect(() => {
    if (!row || !accountId) return;
    if (row.status === "WAITING") return;
    markNotice(`cs_${row.id}`);
    if (row.read_at) return;
    void fetch(`/api/cs/inquiries/${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, read: true }),
    }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (json.inquiry) setRow(json.inquiry);
    }).catch(() => undefined);
  }, [row, accountId, markNotice]);

  const del = async () => {
    if (!row || busy) return;
    setBusy(true);
    const res = await fetch(`/api/cs/inquiries/${encodeURIComponent(row.id)}?accountId=${encodeURIComponent(accountId)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      showToast(json.error || "문의를 삭제하지 못했어요", "err");
      setBusy(false);
      return;
    }
    showToast("문의를 삭제했어요");
    router.replace("/me/cs");
  };

  const waiting = row?.status === "WAITING";
  const answered = row?.status === "ANSWERED" || (row?.status === "CLOSED" && Boolean(row.answer_body));
  const showDelete = waiting && row && canDeleteInquiry(row.created_at);

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me/cs" /><h1>문의 상세</h1><span style={{ width: 36 }} /></div>
        <div className="scroll cs-scroll">
          {row === undefined ? (
            <p className="muted" style={{ textAlign: "center", marginTop: 40 }}>불러오는 중…</p>
          ) : row === null ? null : (
            <>
              <div className="cs-block">
                <div className="cs-block-top">
                  <span className="cs-tag">{row.category}</span>
                  <span className={`cs-badge ${row.status === "WAITING" ? "wait" : row.status === "CLOSED" ? "closed" : "done"}`}>{statusLabel(row.status)}</span>
                </div>
                <h2>{row.title}</h2>
                <p className="cs-body">{row.body}</p>
                {row.images.length ? (
                  <div className="cs-thumbs">
                    {row.images.map((src, i) => (
                      <button key={src.slice(0, 32) + i} className="cs-thumb" type="button" onClick={() => setView(i)}>
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="cs-when">{csDateTime(row.created_at)} 등록</p>
              </div>
              {waiting ? (
                <div className="cs-wait">
                  <b>답변을 준비하고 있어요</b>
                  <span>영업일 기준 1~2일 안에 알려드릴게요</span>
                  {showDelete ? (
                    <button className="cs-del" type="button" disabled={busy} onClick={() => void del()}>문의 삭제</button>
                  ) : null}
                </div>
              ) : null}
              {answered ? (
                <div className="cs-answer">
                  <div className="cs-answer-head">
                    <img src="/brand/logo-mark.png" alt="" />
                    <div>
                      <b>틈 고객지원팀</b>
                      <span>{row.answered_at ? `${csDateTime(row.answered_at)} 답변` : ""}</span>
                    </div>
                  </div>
                  <p className="cs-body">{row.answer_body}</p>
                </div>
              ) : null}
              {row.status === "CLOSED" && !row.answer_body ? (
                <div className="cs-wait">
                  <b>이 문의는 종료됐어요</b>
                  <span>추가로 궁금한 점은 새 문의로 남겨 주세요</span>
                </div>
              ) : null}
            </>
          )}
        </div>
        {row?.status === "ANSWERED" ? (
          <div className="cs-foot">
            <button
              className="btn primary"
              type="button"
              onClick={() => router.push(`/me/cs/new?category=${encodeURIComponent(row.category)}&title=${encodeURIComponent(extraInquiryTitle(row.title))}`)}
            >
              추가 문의하기
            </button>
          </div>
        ) : null}
        {view !== null && row ? (
          <div
            className="cs-viewer"
            onClick={() => setView(null)}
            onTouchStart={(e) => { swipeX.current = e.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
              if (swipeX.current == null || !row) return;
              const dx = (e.changedTouches[0]?.clientX ?? swipeX.current) - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) < 40 || row.images.length < 2) return;
              setView((v) => {
                if (v === null) return v;
                return dx < 0 ? (v + 1) % row.images.length : (v + row.images.length - 1) % row.images.length;
              });
            }}
          >
            <button className="cs-viewer-close" type="button" aria-label="닫기" onClick={() => setView(null)}>✕</button>
            {row.images.length > 1 ? (
              <button
                className="cs-nav prev"
                type="button"
                aria-label="이전"
                onClick={(e) => { e.stopPropagation(); setView((v) => (v === null ? 0 : (v + row.images.length - 1) % row.images.length)); }}
              >
                ‹
              </button>
            ) : null}
            <img src={row.images[view]} alt="" onClick={(e) => e.stopPropagation()} />
            {row.images.length > 1 ? (
              <button
                className="cs-nav next"
                type="button"
                aria-label="다음"
                onClick={(e) => { e.stopPropagation(); setView((v) => (v === null ? 0 : (v + 1) % row.images.length)); }}
              >
                ›
              </button>
            ) : null}
          </div>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
