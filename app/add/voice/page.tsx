"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, Modal, PhoneShell } from "@/components/ui";
import { VoiceWave } from "@/components/VoiceWave";
import { emptyDraft } from "@/lib/catalog";
import { useStore } from "@/lib/store";

type Phase = "idle" | "listen" | "wait" | "fail" | "exit";

function Inner() {
  const router = useRouter();
  const kind = useSearchParams().get("kind") === "event" ? "event" : "subscription";
  const { setDraft, showToast } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [perm, setPerm] = useState(false);
  const [text, setText] = useState("");
  const [sec, setSec] = useState(0);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => () => {
    recRef.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  useEffect(() => {
    if (phase !== "listen") return;
    const t = window.setInterval(() => setSec((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const clock = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

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
      rec.onerror = () => setPhase("fail");
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

  const save = () => {
    recRef.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setPhase("wait");
    setTimeout(() => {
      const raw = text || "넷플릭스 만 칠천원 매달 27일";
      const amount = raw.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/)?.[1]?.replace(/,/g, "") ?? "17000";
      const name = /유튜브|youtube/i.test(raw) ? "YouTube Premium" : /스포티|spotify/i.test(raw) ? "Spotify" : "Netflix";
      setDraft({ ...emptyDraft(), name, amount, fromAi: true, plan: "" });
      if (kind === "event") {
        sessionStorage.setItem("teum:ai-event", JSON.stringify({ title: name, date: new Date().toISOString().slice(0, 10) }));
        router.push("/events/new");
      } else {
        router.push("/add/confirm");
      }
    }, 1400);
  };

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back onClick={() => {
            if (phase === "listen") setPhase("exit");
            else router.back();
          }} />
          <h1>음성으로 등록</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "idle" || phase === "listen" || phase === "exit" ? (
          <div className="scroll voice-idle">
            <h2>말씀해주세요</h2>
            <p className="muted">
              {kind === "event"
                ? "일정명, 날짜, 시간과 그룹을 자연스럽게 말해보세요."
                : "서비스 이름, 금액, 결제일을 자연스럽게 말해보세요."}
            </p>
            <span className="voice-pill">음성 입력</span>
            <img className="teumki-illust" src="/teumki/mic.png" alt="" />
            {phase === "listen" ? <VoiceWave stream={stream} active /> : <img className="voice-idle-wave" src="/voice/wave-idle.png" alt="" />}
            <p className="voice-status">{phase === "listen" ? `듣고 있어요 · ${clock}` : "녹음 대기 · 00:00"}</p>
            {phase === "listen" ? (
              <>
                <p>{text || "듣고 있어요…"}</p>
                <button className="btn primary" type="button" onClick={save}>저장</button>
                <div style={{ height: 8 }} />
                <button className="btn ghost" type="button" onClick={() => setPhase("exit")}>종료</button>
              </>
            ) : (
              <button className="btn primary" type="button" onClick={start}>탭하여 녹음 시작하기</button>
            )}
          </div>
        ) : null}
        {phase === "wait" ? (
          <div className="wait">
            <img className="teumki-illust" src="/teumki/loading.png" alt="" />
            <h2>음성을 정리하고 있어요</h2>
            <p className="muted">확인 화면에서 수정한 뒤에만 등록돼요.</p>
          </div>
        ) : null}
        {phase === "fail" ? (
          <div className="wait">
            <img className="teumki-illust" src="/teumki/sad.png" alt="" />
            <h2>음성을 인식하지 못했어요</h2>
            <p className="muted">조용한 곳에서 다시 말하거나 직접 입력해 주세요.</p>
            <button className="btn primary" type="button" onClick={() => setPhase("idle")}>다시 시도</button>
          </div>
        ) : null}
        {phase === "exit" ? (
          <Modal
            title="음성 등록을 종료할까요?"
            body="지금까지 들은 내용은 저장되지 않아요."
            confirm="종료"
            danger
            onCancel={() => setPhase("listen")}
            onConfirm={() => router.back()}
          />
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
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
};
