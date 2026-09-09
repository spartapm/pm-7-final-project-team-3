"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

function pad(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

export default function VerifyPage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [cool, setCool] = useState(0);
  const [email, setEmail] = useState("example@email.com");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setEmail(sessionStorage.getItem("teum:reset-email") ?? "example@email.com");
  }, []);

  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  const setAt = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = d;
    setDigits(next);
    setErr("");
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = () => {
    const code = digits.join("");
    if (code.length < 6) return;
    const expected = sessionStorage.getItem("teum:code") ?? "123456";
    if (code !== expected) {
      setErr("코드가 일치하지 않습니다. 다시 입력해 주세요");
      return;
    }
    router.push("/forgot/new");
  };

  const resend = () => {
    if (cool > 0) return;
    sessionStorage.setItem("teum:code", "123456");
    setCool(60);
    showToast("인증 코드를 다시 보냈어요.");
  };

  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar"><Back href="/forgot" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>인증 코드를 입력해주세요</h1>
        <p className="muted" style={{ margin: "8px 0 8px", lineHeight: 1.5 }}>
          {email}으로 6자리 코드를 보냈어요
        </p>
        <div className={`otp ${err ? "err" : ""}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`인증코드 ${i + 1}번째 자리`}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                if (e.key === "Enter") submit();
              }}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!t) return;
                e.preventDefault();
                const next = ["", "", "", "", "", ""];
                for (let k = 0; k < t.length; k++) next[k] = t[k];
                setDigits(next);
                setErr("");
                refs.current[Math.min(t.length, 5)]?.focus();
              }}
            />
          ))}
        </div>
        {err ? <div className="err-msg">{err}</div> : null}
        <button
          className={`resend ${cool > 0 ? "off" : ""}`}
          type="button"
          disabled={cool > 0}
          onClick={resend}
        >
          코드 재전송{cool > 0 ? ` (${pad(cool)})` : ""}
        </button>
        <p className="muted" style={{ fontSize: 12, margin: "8px 0 20px" }}>🤔 코드가 오지 않았어요.</p>
        <button className="btn primary" type="button" onClick={submit} disabled={digits.join("").length < 6}>
          인증하기
        </button>
      </div>
    </PhoneShell>
  );
}
