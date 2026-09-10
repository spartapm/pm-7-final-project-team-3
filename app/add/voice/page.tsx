"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { VoiceWave } from "@/components/VoiceWave";
import { afterExtractPath, beginExtract, eventItemFromRaw, subItemFromRaw } from "@/lib/extract";
import { useStore } from "@/lib/store";

type Phase = "idle" | "listen" | "save" | "wait" | "fail" | "exit";

function clockOf(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function Inner() {
  const router = useRouter();
  const kind = useSearchParams().get("kind") === "event" ? "event" : "subscription";
  const { showToast } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [perm, setPerm] = useState(false);
  const [text, setText] = useState("");
  const [sec, setSec] = useState(0);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const stopMic = () => {
    const rec = recRef.current as { stop?: () => void; abort?: () => void; onresult?: null } | null;
    rec?.abort?.();
    rec?.stop?.();
    if (rec) rec.onresult = null;
    recRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  useEffect(() => () => {
    recRef.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  useEffect(() => {
    if (phase !== "listen") return;
    const t = window.setInterval(() => {
      setSec((n) => {
        if (n + 1 >= 59) {
          window.setTimeout(() => toSave(), 0);
          return 59;
        }
        return n + 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    const freeze = () => {
      if (phaseRef.current === "listen") toSave();
    };
    const onVis = () => {
      if (document.hidden) freeze();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", freeze);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", freeze);
    };
  }, []);

  const beginListen = (mic: MediaStream) => {
    setStream(mic);
    const w = window as Window & { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        let t = "";
        for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        setText(t);
      };
      rec.onerror = () => {
        stopMic();
        setPhase("fail");
      };
      recRef.current = rec;
      rec.start();
    }
    setSec(0);
    setPhase("listen");
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast("⚠️  마이크를 사용할 수 없어요. 기기 상태를 확인해주세요.", "err");
      return;
    }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        video: false,
      });
      beginListen(mic);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        showToast("⚠️  마이크를 사용할 수 없어요. 기기 상태를 확인해주세요.", "err");
        return;
      }
      setPerm(true);
    }
  };

  const openSettings = async () => {
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mic.getTracks().forEach((t) => t.stop());
      setPerm(false);
    } catch {
      showToast("브라우저 주소창에서 마이크 권한을 허용해 주세요.", "info");
    }
  };

  const toSave = () => {
    stopMic();
    setPhase("save");
  };

  const retrySpeak = () => {
    setText("");
    setSec(0);
    void start();
  };

  const analyze = async () => {
    if (!text.trim()) return;
    stopMic();
    setPhase("wait");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), kind }),
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
      beginExtract(kind, "voice", items);
      router.push(afterExtractPath(kind, items[0].id));
    } catch {
      if (phaseRef.current !== "wait") return;
      setPhase("fail");
    } finally {
      window.clearTimeout(timer);
    }
  };

  const recording = phase === "listen" || phase === "save" || phase === "exit";
  const clock = clockOf(sec);

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => {
            if (phase === "listen" || phase === "save" || phase === "idle") {
              stopMic();
              setPhase("exit");
            } else if (phase === "wait") {
              setPhase("save");
            } else {
              router.back();
            }
          }} />
          <h1>음성으로 등록</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "idle" || recording ? (
          <div className="scroll voice-idle">
            <h2>말씀해주세요</h2>
            <p className="muted">
              {kind === "event"
                ? "일정명, 날짜, 시간과 그룹을 자연스럽게 말해보세요."
                : "서비스 이름, 금액, 결제일을 자연스럽게 말해보세요."}
            </p>
            <span className="voice-pill">음성 입력</span>
            <img className="teumki-illust" src="/teumki/mic.png" alt="" />
            {phase === "listen" || phase === "exit" ? (
              <VoiceWave stream={stream} active={phase === "listen"} />
            ) : (
              <img className="voice-idle-wave" src={phase === "save" ? "/voice/wave-idle.png" : "/voice/wave-idle.png"} alt="" />
            )}
            <p className="voice-status">
              {phase === "save" ? `다 들었어요 · ${clock}` : phase === "listen" || phase === "exit" ? `듣고 있어요 · ${clock}` : "녹음 대기 · 00:00"}
            </p>
            {phase === "listen" || phase === "save" || phase === "exit" ? (
              <>
                <div className="voice-card">
                  <div className="voice-card-top">
                    <span>{phase === "save" ? "AI 인식" : "인식"}</span>
                    {phase === "save" ? <span className="voice-pencil" aria-hidden>✎</span> : null}
                  </div>
                  {phase === "save" ? (
                    <textarea value={text} onChange={(e) => setText(e.target.value)} />
                  ) : (
                    <p>{text || "듣고 있어요…"}</p>
                  )}
                </div>
                <div className="voice-duo">
                  {phase === "save" ? (
                    <button className="btn ghost" type="button" onClick={retrySpeak}>다시 말하기</button>
                  ) : (
                    <button className="btn ghost" type="button" onClick={toSave}>중단</button>
                  )}
                  <button
                    className="btn primary"
                    type="button"
                    disabled={phase !== "save" || !text.trim()}
                    onClick={analyze}
                  >
                    저장
                  </button>
                </div>
              </>
            ) : (
              <button className="btn primary" type="button" onClick={start}>탭하여 녹음 시작하기</button>
            )}
          </div>
        ) : null}
        {phase === "wait" ? (
          <div className="wait">
            <button className="icon-btn wait-close" type="button" aria-label="닫기" onClick={() => { phaseRef.current = "save"; setPhase("save"); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <img className="teumki-illust" src="/teumki/loading.png" alt="" />
            <h2>음성을 분석하고 있어요</h2>
            <p className="muted">잠시만 기다리시면 제가 적어드릴게요.</p>
            <p className="inspect-note">ⓘ 음성 인식이 제대로 안되었을 경우 직접 수정 진행하셔야 합니다.</p>
          </div>
        ) : null}
        {phase === "fail" ? (
          <div className="wait">
            <img className="teumki-illust" src="/teumki/sad.png" alt="" />
            <h2>음성으로 등록하지 못했어요</h2>
            <p className="muted">일시적인 오류로 분석이 중단됐어요.<br />잠시 후 다시 등록해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => { setText(""); setSec(0); setPhase("idle"); }}>다시 시도하기</button>
          </div>
        ) : null}
        {phase === "exit" ? (
          <div className="modal-back" onClick={() => setPhase("listen")}>
            <div className="modal voice-perm" onClick={(e) => e.stopPropagation()}>
              <img className="modal-mascot" src="/teumki/curious.png" alt="" />
              <h3>음성 분석을 그만할까요?</h3>
              <p>분석 중인 내용은 저장되지 않아요.</p>
              <div className="modal-actions">
                <button className="btn cancel" type="button" onClick={() => { stopMic(); router.back(); }}>분석 그만하기</button>
                <button className="btn primary" type="button" onClick={() => setPhase("listen")}>계속 진행하기</button>
              </div>
            </div>
          </div>
        ) : null}
        {perm ? (
          <div className="modal-back" onClick={() => setPerm(false)}>
            <div className="modal voice-perm" onClick={(e) => e.stopPropagation()}>
              <img className="modal-mascot" src="/teumki/perm2.png" alt="" />
              <h3>마이크 권한이 필요해요</h3>
              <p>음성으로 일정을 등록하려면<br />마이크 접근을 허용해주세요</p>
              <div className="modal-actions">
                <button className="btn ghost" type="button" onClick={() => { setPerm(false); router.back(); }}>다른 방법으로 등록</button>
                <button className="btn primary" type="button" onClick={openSettings}>설정으로 이동</button>
              </div>
            </div>
          </div>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}

export default function AddVoicePage() {
  return <Suspense><Inner /></Suspense>;
}

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
};
