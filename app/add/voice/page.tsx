"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, Gate, Modal, PhoneShell } from "@/components/ui";
import { VoiceWave } from "@/components/VoiceWave";
import { emptyDraft } from "@/lib/catalog";
import { useStore } from "@/lib/store";

type Phase = "perm" | "idle" | "listen" | "wait" | "fail" | "exit";

function Inner() {
  const router = useRouter();
  const kind = useSearchParams().get("kind") === "event" ? "event" : "subscription";
  const { setDraft } = useStore();
  const [phase, setPhase] = useState<Phase>("perm");
  const [text, setText] = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => () => {
    recRef.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  const start = async () => {
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        video: false,
      });
      setStream(mic);
    } catch {
      setPhase("fail");
      return;
    }
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
    setPhase("listen");
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
          <h1>음성으로 추가</h1>
          <span style={{ width: 36 }} />
        </div>
        {phase === "perm" ? (
          <div className="scroll" style={{ textAlign: "center" }}>
            <img className="teumki-illust" src="/teumki/perm1.png" alt="" />
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>마이크 권한이 필요해요</h2>
            <p className="muted">말한 내용을 구독 초안으로 바꾸려면 마이크 접근이 필요해요. 거부하면 직접 입력으로 진행할 수 있어요.</p>
            <div style={{ height: 16 }} />
            <button className="btn primary" type="button" onClick={() => setPhase("idle")}>허용</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => router.push(kind === "event" ? "/events/new" : "/subscriptions/new")}>직접 입력</button>
          </div>
        ) : null}
        {phase === "idle" ? (
          <div className="scroll" style={{ textAlign: "center" }}>
            <img className="teumki-illust" src="/teumki/mic.png" alt="" />
            <img src="/voice/wave-idle.png" alt="" style={{ width: "70%", margin: "0 auto 16px" }} />
            <p>서비스 이름과 금액을 말해 주세요.</p>
            <p className="muted">예: 넷플릭스 만 칠천 원, 매달 27일</p>
            <button className="btn primary" type="button" onClick={start}>듣기 시작</button>
          </div>
        ) : null}
        {phase === "listen" ? (
          <div className="scroll" style={{ textAlign: "center" }}>
            <img className="teumki-illust" src="/teumki/mic.png" alt="" />
            <VoiceWave stream={stream} active />
            <p>{text || "듣고 있어요…"}</p>
            <button className="btn primary" type="button" onClick={save}>저장</button>
            <div style={{ height: 8 }} />
            <button className="btn ghost" type="button" onClick={() => setPhase("exit")}>종료</button>
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
