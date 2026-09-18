"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { fileToCsImage, inlineFromDataUrl } from "@/lib/cs";
import { afterExtractPath, beginExtract, eventItemFromRaw, subItemFromRaw } from "@/lib/extract";
import { bumpRetry, countGroup, readRetry, retryGroup, track } from "@/lib/ga";
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const startedAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const goneRef = useRef(false);
  const filesRef = useRef(files);
  filesRef.current = files;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => () => {
    goneRef.current = true;
    abortRef.current?.abort();
    filesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
  }, []);

  const pickFiles = async (list: FileList | File[] | null) => {
    const incoming = Array.from(list ?? []);
    if (incoming.some((f) => !isPngJpg(f))) {
      showToast("⚠️  PNG 또는 JPG 형식의 이미지만 올릴 수 있어요.", "err");
      return;
    }
    if (files.length >= MAX || files.length + incoming.length > MAX) {
      showToast("⚠️  이미지는 최대 3장까지 올릴 수 있어요.", "err");
      return;
    }
    const next: { url: string; name: string }[] = [];
    for (const file of incoming.slice(0, MAX - files.length)) {
      try {
        next.push({ url: await fileToCsImage(file), name: file.name });
      } catch {
        showToast("⚠️  이미지를 읽지 못했어요.", "err");
      }
    }
    if (!next.length) return;
    setFiles((xs) => [...xs, ...next]);
    const total = files.length + next.length;
    const types = [...new Set(incoming.map((f) => (f.type.includes("png") || /\.png$/i.test(f.name) ? "png" : "jpg")))];
    track("image_upload_complete", {
      image_count_group: countGroup(total),
      file_type: types.length > 1 ? "mixed" : (types[0] || "jpg"),
    });
    track("photo_permission_result", { result: "granted" });
  };

  const analyze = async () => {
    if (files.length === 0) return;
    startedAt.current = Date.now();
    track("image_analysis_start", { retry_count_group: retryGroup(readRetry("image")) });
    setPhase("wait");
    phaseRef.current = "wait";
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = window.setTimeout(() => ctrl.abort(), files.length > 1 ? 70000 : 45000);
    type Row = { name?: string; plan?: string; amount?: string; day?: number | null; title?: string; date?: string; endDate?: string; start?: string; end?: string };
    const readResult = async (images: { mime: string; data: string }[]) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, kind }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({})) as { ok?: boolean; items?: Row[]; data?: Row };
      const rows = json.items?.length ? json.items : json.data ? [json.data] : [];
      return { ok: Boolean(json.ok && rows.length), rows };
    };
    try {
      const images = files.slice(0, MAX).map((f) => inlineFromDataUrl(f.url));
      let rows: Row[] = [];
      const first = await readResult(images);
      rows = first.rows;
      if (!first.ok && images.length > 1) {
        const merged: Row[] = [];
        for (const img of images) {
          if (ctrl.signal.aborted || goneRef.current) break;
          const one = await readResult([img]);
          if (one.ok) merged.push(...one.rows);
        }
        rows = merged;
      }
      if (goneRef.current || phaseRef.current !== "wait") return;
      if (rows.length === 0) {
        track("image_analysis_failed", { failure_type: "parse", processing_time_ms: Date.now() - startedAt.current });
        setPhase("fail");
        return;
      }
      const items = kind === "event" ? rows.map(eventItemFromRaw) : rows.map(subItemFromRaw);
      beginExtract(kind, "image", items);
      router.push(afterExtractPath(kind, "image"));
    } catch {
      if (goneRef.current || phaseRef.current !== "wait") return;
      track("image_analysis_failed", { failure_type: "timeout", processing_time_ms: Date.now() - startedAt.current });
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
            abortRef.current?.abort();
            goneRef.current = true;
            files.forEach((f) => URL.revokeObjectURL(f.url));
            setFiles([]);
            router.replace("/home");
          }} />
          <h1>이미지로 추가</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "pick" ? (
          <div className="scroll">
            <h2 className="add-title">추가할 이미지를 올려주세요</h2>
            <p className="add-lead">영수증·청첩장·초대장을 올리면 구독과 일정을 함께 찾아드려요.</p>
            <div className={`img-guide${guideOpen ? " is-open" : ""}`}>
              {guideOpen ? (
                <>
                  <button
                    type="button"
                    className="img-guide-full"
                    aria-expanded="true"
                    onClick={() => setGuideOpen(false)}
                  >
                    <img src="/add/ExampleGuide.png" alt="이런 이미지를 올려주세요. 결제 영수증, 청첩장·초대장" />
                    <svg className="img-guide-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <img className="img-avoid" src="/add/AvoidHint.png" alt="흐릿하거나 글자가 잘린 사진, 손글씨 메모는 인식이 어려워요." />
                </>
              ) : (
                <button
                  type="button"
                  className="img-guide-toggle"
                  aria-expanded="false"
                  onClick={() => setGuideOpen(true)}
                >
                  <span className="img-guide-pill">예시</span>
                  <span className="img-guide-label">이런 이미지를 올려주세요</span>
                  <svg className="img-guide-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
            <button className="upload-area" type="button" onClick={() => {
              if (files.length >= MAX) {
                showToast("⚠️  이미지는 최대 3장까지 올릴 수 있어요.", "err");
                return;
              }
              inputRef.current?.click();
            }}>
              <span className="upload-plus" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V7M12 7 7 12M12 7l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong>이미지 추가하기</strong>
              <em>최대 3장 · PNG / JPG</em>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              hidden
              onChange={(e) => {
                void pickFiles(e.target.files);
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
            <button className="icon-btn wait-close" type="button" aria-label="닫기" onClick={() => {
              abortRef.current?.abort();
              phaseRef.current = "pick";
              setPhase("pick");
            }}>
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
            <button className="btn primary" type="button" onClick={() => { bumpRetry("image"); setPhase("pick"); }}>다시 시도하기</button>
          </div>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

export default function AddImagePage() {
  return <Suspense><Inner /></Suspense>;
}
