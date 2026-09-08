"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { emailError, passwordError } from "@/lib/validate";

export default function LoginPage() {
  const router = useRouter();
  const { login, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eErr, setEErr] = useState("");
  const [pErr, setPErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const ee = emailError(email);
    const pe = passwordError(password);
    setEErr(ee);
    setPErr(pe);
    if (ee || pe) return;
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.server) {
      showToast("서버가 불안정합니다. 잠시 후 다시 시도해주세요.", "err");
      return;
    }
    if (!res.ok) {
      showToast(res.error ?? "로그인에 실패했습니다.", "err");
      return;
    }
    router.replace("/home");
  };

  const social = () => showToast("1차 개발 범위에서 제외된 기능이에요.", "info");

  return (
    <PhoneShell>
      <div className="auth">
        <div className="brand-block">
          <Logo large />
          <div className="slogan">구독도 일정도, 빈틈없이</div>
        </div>
        <div className={`field inbox ${eErr ? "err" : ""}`}>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            inputMode="email"
            autoCapitalize="none"
            maxLength={30}
          />
        </div>
        {eErr ? <div className="err-msg">{eErr}</div> : null}
        <div className={`field inbox ${pErr ? "err" : ""}`}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            maxLength={20}
          />
        </div>
        {pErr ? <div className="err-msg">{pErr}</div> : null}
        <Link className="forgot-link" href="/forgot">비밀번호를 잊으셨나요?</Link>
        <button className="btn primary" type="button" onClick={submit} disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
        <div className="or">또는</div>
        <button className="btn google social" type="button" onClick={social}>
          <img src="/icons/google.png" alt="" width={22} height={22} />
          Google로 계속하기
        </button>
        <div style={{ height: 8 }} />
        <button className="btn kakao social" type="button" onClick={social}>
          <img src="/icons/kakao.png" alt="" width={22} height={22} />
          카카오로 계속하기
        </button>
        <div className="auth-foot">
          계정이 없으신가요?  <Link href="/signup">회원가입</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
