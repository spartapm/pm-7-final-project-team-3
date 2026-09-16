"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { CS_CATEGORIES, fileToCsImage, isCsCategory } from "@/lib/cs";
import { useStore } from "@/lib/store";

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const preCat = sp.get("category") ?? "";
  const preTitle = sp.get("title") ?? "";
  const { accountId, showToast } = useStore();
  const [category, setCategory] = useState(isCsCategory(preCat) ? preCat : "");
  const [title, setTitle] = useState(preTitle.slice(0, 40));
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = Boolean(category && title.trim() && body.trim().length >= 10);

  const helper = useMemo(() => {
    if (!body.trim()) return "";
    if (body.trim().length < 10) return "10자 이상 입력해주세요";
    return "";
  }, [body]);

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    if (images.length >= 3) {
      showToast("이미지는 3장까지 첨부할 수 있어요", "info");
      return;
    }
    const room = 3 - images.length;
    if (files.length > room) showToast("이미지는 3장까지 첨부할 수 있어요", "info");
    const next = images.slice();
    for (const file of files.slice(0, room)) {
      try {
        next.push(await fileToCsImage(file));
      } catch (e) {
        showToast(e instanceof Error ? e.message : "이미지를 첨부하지 못했어요", "err");
      }
    }
    setImages(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cs/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          category,
          title: title.trim(),
          body: body.trim(),
          images,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        showToast(json.error || "문의를 등록하지 못했어요. 잠시 후 다시 시도해주세요.", "err");
        setBusy(false);
        return;
      }
      showToast("문의를 보냈어요. 영업일 기준 1~2일 내 답변드려요.");
      router.replace("/me/cs");
    } catch {
      showToast("문의를 등록하지 못했어요. 잠시 후 다시 시도해주세요.", "err");
      setBusy(false);
    }
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me/cs" /><h1>문의 작성</h1><span style={{ width: 36 }} /></div>
        <div className="scroll cs-scroll">
          <h2 className="cs-sec">어떤 점이 궁금하신가요</h2>
          <div className="cs-cats">
            {CS_CATEGORIES.map((c) => (
              <button key={c} className={`chip outline ${category === c ? "on" : ""}`} type="button" onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <label className="cs-label" htmlFor="cs-title">제목</label>
          <div className="field inbox cs-field">
            <input
              id="cs-title"
              maxLength={40}
              value={title}
              placeholder="넷플릭스 구독이 등록되지 않아요"
              onChange={(e) => setTitle(e.target.value.slice(0, 40))}
            />
            <span className="cs-count">{title.length}/40</span>
          </div>
          <label className="cs-label" htmlFor="cs-body">내용</label>
          <div className="field inbox cs-field tall">
            <textarea
              id="cs-body"
              maxLength={1000}
              value={body}
              placeholder="카드 내역에는 결제가 찍혀 있는데…"
              onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            />
            <span className="cs-count">{body.length}/1000</span>
          </div>
          {helper ? <p className="cs-help">{helper}</p> : null}
          <div className="cs-label">사진 첨부 · 최대 3장</div>
          <div className="cs-thumbs">
            {images.map((src, i) => (
              <button key={`${src.slice(0, 24)}-${i}`} className="cs-thumb" type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}>
                <img src={src} alt="" />
                <span aria-hidden>×</span>
              </button>
            ))}
            {images.length < 3 ? (
              <button className="cs-thumb add" type="button" onClick={() => fileRef.current?.click()}>＋</button>
            ) : null}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple hidden onChange={(e) => void addFiles(e.target.files)} />
          </div>
        </div>
        <div className="cs-foot">
          <button className="btn primary cs-send" type="button" disabled={!ready || busy} onClick={() => void submit()}>
            {busy ? "보내는 중…" : "문의 보내기"}
          </button>
        </div>
      </PhoneShell>
    </Gate>
  );
}

export default function CsNewPage() {
  return (
    <Suspense fallback={<PhoneShell><div className="scroll" /></PhoneShell>}>
      <Inner />
    </Suspense>
  );
}
