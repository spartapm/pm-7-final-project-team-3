"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, Modal, PhoneShell } from "@/components/ui";
import { emptyDraft } from "@/lib/catalog";
import { useStore } from "@/lib/store";

type Phase = "perm" | "pick" | "wait" | "fail" | "leave";

function Inner() {
  const router = useRouter();
  const kind = useSearchParams().get("kind") === "event" ? "event" : "subscription";
  const { setDraft, showToast } = useStore();
  const [phase, setPhase] = useState<Phase>("perm");
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = () => {
    if (files.length === 0) {
      showToast("이미지를 한 장 이상 선택해 주세요.", "err");
      return;
    }
    setPhase("wait");
    setTimeout(() => {
      if (files.length > 6) {
        setPhase("fail");
        return;
      }
      setDraft({
        ...emptyDraft(),
        name: kind === "event" ? "" : "Netflix",
        plan: "스탠다드",
        amount: "17000",
        category: "ott",
        fromAi: true,
      });
      if (kind === "event") {
        sessionStorage.setItem("teum:ai-event", JSON.stringify({ title: "Netflix 결제", date: new Date().toISOString().slice(0, 10) }));
        router.push("/events/new");
      } else {
        router.push("/add/confirm");
      }
    }, 1600);
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => {
            if (phase === "pick" && files.length > 0) setPhase("leave");
            else router.back();
          }} />
          <h1>이미지로 추가</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "perm" ? (
          <div className="scroll">
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>사진 접근 권한이 필요해요</h2>
            <p className="muted" style={{ lineHeight: 1.55 }}>결제 내역 스크린샷에서 구독 후보를 찾으려면 사진 보관함에 접근해야 해요. 선택한 이미지는 기기에만 쓰입니다.</p>
            <div style={{ height: 16 }} />
            <button className="btn primary" type="button" onClick={() => setPhase("pick")}>허용</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => router.back()}>나중에</button>
          </div>
        ) : null}
        {phase === "pick" ? (
          <div className="scroll">
            <p className="muted">{files.length}장 선택됨 · 필요 없는 이미지는 삭제할 수 있어요</p>
            <div className="thumb-grid" style={{ margin: "12px 0" }}>
              {files.map((f, i) => (
                <div key={i} className="thumb">
                  <img src={f.url} alt="" />
                  <button className="x" type="button" onClick={() => setFiles((xs) => xs.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button className="thumb" type="button" onClick={() => inputRef.current?.click()} style={{ display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 28 }}>+</button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
                setFiles((xs) => [...xs, ...next].slice(0, 8));
              }}
            />
            <button className="btn primary" type="button" onClick={analyze}>분석하기</button>
          </div>
        ) : null}
        {phase === "wait" ? (
          <div className="wait">
            <div className="spinner" />
            <h2>이미지를 읽고 있어요</h2>
            <p className="muted">서비스명, 금액, 결제 주기를 찾는 중이에요. 확인 전까지는 목록에 넣지 않아요.</p>
          </div>
        ) : null}
        {phase === "fail" ? (
          <div className="wait">
            <h2>이미지에서 구독을 찾지 못했어요</h2>
            <p className="muted">더 선명한 결제 내역 화면으로 다시 시도하거나, 직접 입력해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => setPhase("pick")}>다시 시도</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => router.push(kind === "event" ? "/events/new" : "/subscriptions/new")}>직접 입력</button>
          </div>
        ) : null}
        {phase === "leave" ? (
          <Modal
            title="추출 결과를 버릴까요?"
            body="지금 나가면 선택한 이미지와 분석 초안이 삭제돼요."
            confirm="나가기"
            danger
            onCancel={() => setPhase("pick")}
            onConfirm={() => router.back()}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

export default function AddImagePage() {
  return <Suspense><Inner /></Suspense>;
}
