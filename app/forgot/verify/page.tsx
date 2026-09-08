"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function VerifyPage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setAt = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = () => {
    const code = digits.join("");
    const expected = sessionStorage.getItem("teum:code") ?? "123456";
    if (code.length < 6) {
      showToast("6자리 인증코드를 입력해 주세요.", "err");
      return;
    }
    if (code !== expected) {
      showToast("인증코드가 올바르지 않습니다.", "err");
      return;
    }
    router.push("/forgot/new");
  };

  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar"><Back href="/forgot" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>인증 코드 확인</h1>
        <p className="muted" style={{ margin: "8px 0 8px", lineHeight: 1.5 }}>이메일로 보낸 6자리 코드를 입력해 주세요.</p>
        <div className="otp">
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
                refs.current[Math.min(t.length, 5)]?.focus();
              }}
            />
          ))}
        </div>
        <button className="btn primary" type="button" onClick={submit}>확인</button>
      </div>
    </PhoneShell>
  );
}
