"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { afterExtractPath, beginExtract, eventItemFromRaw, subItemFromRaw } from "@/lib/extract";
import { useStore } from "@/lib/store";

type Phase = "pick" | "wait" | "fail";
const MAX = 3;

function isPngJpg(file: File) {
  const t = file.type.toLowerCase();
  if (t === "image/png" || t === "image/jpeg" || t === "image/jpg") return true;
  return /\.(png|jpe?g)$/i.test(file.name);
}

function Inner() {
  const router = useRouter();
  const kind = useSearchParams().get("kind") === "event" ? "event" : "subscription";
  const { showToast } = useStore();
  const [phase, setPhase] = useState<Phase>("pick");
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const pickFiles = (list: FileList | File[] | null) => {
    const incoming = Array.from(list ?? []);
    if (incoming.some((f) => !isPngJpg(f))) {
      showToast("⚠️  PNG 또는 JPG 형식의 이미지만 올릴 수 있어요.", "err");
      return;
    }
    if (files.length >= MAX || files.length + incoming.length > MAX) {
      showToast("⚠️  이미지는 최대 3장까지 올릴 수 있어요.", "err");
      return;
    }
    const next = incoming.slice(0, MAX - files.length).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setFiles((xs) => [...xs, ...next]);
  };

  const analyze = async () => {
    if (files.length === 0) return;
    setPhase("wait");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 25000);
    try {
      const images = await Promise.all(files.slice(0, MAX).map(async (f) => {
        const blob = await fetch(f.url).then((r) => r.blob());
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return { mime: blob.type || "image/jpeg", data: btoa(bin) };
      }));
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, kind }),
        signal: ctrl.signal,
      });
      const json = await res.json() as {
        ok?: boolean;
        items?: { name?: string; plan?: string; amount?: string; day?: number | null; title?: string; date?: string; endDate?: string; start?: string; end?: string }[];
        data?: { name?: string; plan?: string; amount?: string; day?: number; title?: string; date?: string };
      };
      if (phaseRef.current !== "wait") return;
      const rows = json.items?.length ? json.items : json.data ? [json.data] : [];
      if (!json.ok || rows.length === 0) {
        setPhase("fail");
        return;
      }
      const items = kind === "event" ? rows.map(eventItemFromRaw) : rows.map(subItemFromRaw);
      beginExtract(kind, "image", items);
      router.push(afterExtractPath(kind, items[0].id));
    } catch {
      if (phaseRef.current !== "wait") return;
      setPhase("fail");
    } finally {
      window.clearTimeout(timer);
    }
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => {
            setFiles([]);
            router.replace("/home");
          }} />
          <h1>이미지로 추가</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "pick" ? (
          <div className="scroll">
            <h2 className="add-title">추가 할 이미지를 올려주세요</h2>
            <p className="muted">여러 장 올려도 구독 및 일정을 함께 찾을 수 있어요.</p>
            <button className="upload-area" type="button" onClick={() => {
              if (files.length >= MAX) {
                showToast("⚠️  이미지는 최대 3장까지 올릴 수 있어요.", "err");
                return;
              }
              inputRef.current?.click();
            }}>
              <span className="upload-plus">↑</span>
              <strong>이미지 추가하기</strong>
              <em>최대 3장 · PNG/JPG</em>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              hidden
              onChange={(e) => {
                pickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 ? (
              <>
                <p className="upload-count">{files.length}장 선택됨 · 필요 없는 이미지는 삭제할 수 있어요</p>
                <div className="thumb-grid" style={{ margin: "12px 0" }}>
                  {files.map((f, i) => (
                    <div key={i} className="thumb">
                      <img src={f.url} alt="" />
                      <button className="x" type="button" onClick={() => setFiles((xs) => xs.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <button className="btn primary" type="button" disabled={files.length === 0} onClick={() => void analyze()}>이미지 분석하기</button>
          </div>
        ) : null}
        {phase === "wait" ? (
          <div className="wait">
            <button className="icon-btn wait-close" type="button" aria-label="닫기" onClick={() => { phaseRef.current = "pick"; setPhase("pick"); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <img className="teumki-illust" src="/teumki/loading.png" alt="" />
            <h2>이미지를 스캔하고 있어요</h2>
            <p className="muted">잠시만 기다리시면 제가 적어드릴게요.</p>
            <p className="inspect-note">ⓘ 이미지 인식이 제대로 안되었을 경우 직접 수정 진행하셔야 합니다.</p>
          </div>
        ) : null}
        {phase === "fail" ? (
          <div className="wait">
            <img className="teumki-illust" src="/teumki/sad.png" alt="" />
            <h2>이미지를 스캔하지 못했어요</h2>
            <p className="muted">일시적인 오류로 분석이 중단됐어요.<br />잠시 후 다시 등록해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => setPhase("pick")}>다시 시도하기</button>
          </div>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

export default function AddImagePage() {
  return <Suspense><Inner /></Suspense>;
}
