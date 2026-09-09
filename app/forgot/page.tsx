"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { emailError } from "@/lib/validate";

export default function ForgotPage() {
  const router = useRouter();
  const { emailRegistered } = useStore();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar"><Back href="/login" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>비밀번호를 잊으셨나요?</h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>가입하신 이메일로 인증 코드를 보내드릴게요</p>
        <div className={`field inbox ${err ? "err" : ""}`}>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(""); }}
            placeholder="example@email.com"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            maxLength={30}
          />
        </div>
        {err ? <div className="err-msg">{err}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={busy || Boolean(emailError(email))}
          onClick={async () => {
            const ee = emailError(email);
            setErr(ee);
            if (ee) return;
            setBusy(true);
            const found = await emailRegistered(email);
            setBusy(false);
            if (!found) {
              setErr("가입되지 않은 이메일 입니다.");
              return;
            }
            sessionStorage.setItem("teum:reset-email", email.trim().toLowerCase());
            sessionStorage.setItem("teum:code", "123456");
            router.push("/forgot/verify");
          }}
        >
          {busy ? "확인 중…" : "인증 코드 받기"}
        </button>
      </div>
    </PhoneShell>
  );
}
