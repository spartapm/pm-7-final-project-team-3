"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Back, BounceIfAuthed, Modal, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PASSWORD_HINT, emailError, passwordError } from "@/lib/validate";

function LoginInner() {
  const router = useRouter();
  const q = useSearchParams();
  const { login, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eErr, setEErr] = useState("");
  const [pErr, setPErr] = useState("");
  const [pwFocus, setPwFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState(false);

  const submit = async () => {
    const ee = emailError(email);
    setEErr(ee);
    if (ee) {
      setPErr("");
      return;
    }
    if (!password.trim()) {
      setPErr(passwordError(password));
      return;
    }
    setPErr("");
    setPwFocus(false);
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.server) {
      showToast("서버가 불안정합니다. 잠시 후 다시 시도해주세요.", "err");
      return;
    }
    if (!res.ok) {
      showToast(res.error ?? "가입되지 않았거나, 이메일 또는 비밀번호가 일치하지 않습니다.", "err");
      return;
    }
    router.replace("/home");
  };

  useEffect(() => {
    if (q.get("social") === "fail") showToast("소셜 로그인에 실패했어요. 다시 시도해주세요.", "err");
  }, [q, showToast]);

  const social = (provider: "google" | "kakao") => {
    window.location.href = provider === "google" ? "/api/auth/google" : "/api/auth/kakao";
  };

  return (
    <PhoneShell>
      <BounceIfAuthed />
      <div className="auth">
        <div className="topbar">
          <Back onClick={() => setExit(true)} />
        </div>
        <div className="brand-block" style={{ paddingTop: 8 }}>
          <img className="login-logo" src="/brand/logo-slogan.png" alt="틈 — 구독도 일정도, 빈틈없이" />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className={`field inbox ${eErr ? "err" : ""}`}>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
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
            onFocus={() => setPwFocus(true)}
            onBlur={() => setPwFocus(false)}
            placeholder="비밀번호 입력"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            maxLength={20}
          />
        </div>
        {pErr ? <div className="err-msg">{pErr}</div> : pwFocus ? <div className="field-hint">{PASSWORD_HINT}</div> : null}
        <Link className="forgot-link" href="/forgot">비밀번호를 잊으셨나요?</Link>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
        </form>
        <div className="or">또는</div>
        <button className="btn google social" type="button" onClick={() => social("google")}>
          <img src="/icons/google.png" alt="" width={22} height={22} />
          Google로 계속하기
        </button>
        <div style={{ height: 8 }} />
        <button className="btn kakao social" type="button" onClick={() => social("kakao")}>
          <img src="/icons/kakao.png" alt="" width={22} height={22} />
          카카오로 계속하기
        </button>
        <div className="auth-foot">
          계정이 없으신가요?  <Link href="/signup">회원가입</Link>
        </div>
      </div>
      {exit ? (
        <Modal
          title="종료하시겠어요?"
          body="틈을 닫으면 로그인 화면이 끝납니다."
          cancel="취소"
          confirm="종료"
          onCancel={() => setExit(false)}
          onConfirm={() => {
            setExit(false);
            window.close();
            showToast("브라우저에서 탭을 닫아 주세요.");
          }}
        />
      ) : null}
    </PhoneShell>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
