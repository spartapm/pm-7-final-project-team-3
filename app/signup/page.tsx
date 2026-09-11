"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Back, BounceIfAuthed, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PASSWORD_HINT, emailError, signupPasswordError } from "@/lib/validate";

const DRAFT = "teum:signup-draft";

const TERMS = [
  { key: "age", required: true, label: "[필수] 만 14세 이상입니다.", doc: "age" },
  { key: "terms", required: true, label: "[필수] 이용약관 동의", doc: "terms" },
  { key: "privacy", required: true, label: "[필수] 개인정보 처리방침 동의", doc: "privacy" },
  { key: "marketing", required: false, label: "[선택] 마케팅 정보 수신 동의", doc: "marketing" },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const { signup, logout, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState({ age: false, terms: false, privacy: false, marketing: false });
  const [eErr, setEErr] = useState("");
  const [pErr, setPErr] = useState("");
  const [cErr, setCErr] = useState("");
  const [pwFocus, setPwFocus] = useState(false);
  const [cfFocus, setCfFocus] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT);
      if (!raw) return;
      const d = JSON.parse(raw) as { email?: string; password?: string; confirm?: string; agree?: typeof agree };
      if (d.email) setEmail(d.email);
      if (d.password) setPassword(d.password);
      if (d.confirm) setConfirm(d.confirm);
      if (d.agree) setAgree(d.agree);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    sessionStorage.setItem(DRAFT, JSON.stringify({ email, password, confirm, agree }));
  }, [email, password, confirm, agree]);

  const requiredOk = agree.age && agree.terms && agree.privacy;
  const allOk = requiredOk && agree.marketing;

  const toggleAll = (v: boolean) => {
    setAgree({ age: v, terms: v, privacy: v, marketing: v });
  };

  const submit = async () => {
    const ee = emailError(email);
    const pe = signupPasswordError(password);
    const ce = !confirm
      ? signupPasswordError(confirm)
      : password !== confirm
        ? "비밀번호가 일치 하지 않습니다. 다시 확인해주세요."
        : signupPasswordError(confirm);
    setEErr(ee);
    setPErr(pe);
    setCErr(ce && password === confirm ? pe : ce);
    if (ee || pe || (password !== confirm)) return;
    if (!requiredOk) {
      showToast("필수 약관에 동의해 주세요.", "err");
      return;
    }
    setBusy(true);
    const res = await signup(email, password, agree.marketing);
    setBusy(false);
    if (!res.ok) {
      if (res.error?.includes("이미 가입")) setEErr("이미 가입된 이메일입니다.");
      else showToast(res.error ?? "가입에 실패했습니다.", "err");
      return;
    }
    sessionStorage.removeItem(DRAFT);
    logout();
    router.push("/signup/done");
  };

  return (
    <PhoneShell>
      <div className="auth">
        <BounceIfAuthed />
        <div className="topbar">
          <Back href="/login" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 6px" }}>회원가입</h1>
        <p className="muted" style={{ marginBottom: 20 }}>이메일로 간편하게 시작하세요.</p>
        <div className={`field inbox ${eErr ? "err" : ""}`}>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEErr(""); }}
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
            onChange={(e) => { setPassword(e.target.value); setPErr(""); }}
            onFocus={() => setPwFocus(true)}
            onBlur={() => setPwFocus(false)}
            placeholder="비밀번호 입력"
            autoCapitalize="none"
            maxLength={20}
          />
        </div>
        {pErr ? <div className="err-msg">{pErr}</div> : pwFocus ? <div className="field-hint">{PASSWORD_HINT}</div> : null}
        <div className={`field inbox ${cErr ? "err" : ""}`}>
          <label>비밀번호 확인</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setCErr(""); }}
            onFocus={() => setCfFocus(true)}
            onBlur={() => setCfFocus(false)}
            placeholder="비밀번호 재입력"
            autoCapitalize="none"
            maxLength={20}
          />
        </div>
        {cErr ? <div className="err-msg">{cErr}</div> : cfFocus ? <div className="field-hint">{PASSWORD_HINT}</div> : null}

        <p className="agree-lead">서비스 이용을 위해 아래 약관 동의가 필요해요.</p>
        <div className="agree-box">
          <label className="agree-row all">
            <input type="checkbox" checked={allOk} onChange={(e) => toggleAll(e.target.checked)} />
            <span>전체 동의</span>
          </label>
          {TERMS.map((t) => (
            <label key={t.key} className="agree-row">
              <input
                type="checkbox"
                checked={agree[t.key]}
                onChange={(e) => setAgree((s) => ({ ...s, [t.key]: e.target.checked }))}
              />
              <span>{t.label}</span>
              <Link className="agree-detail" href={`/signup/terms?doc=${t.doc}`}>자세히</Link>
            </label>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <button className="btn primary" type="button" onClick={submit} disabled={busy || !requiredOk}>
          {busy ? "가입 중…" : "가입하기"}
        </button>
        <div className="or">또는</div>
        <button className="btn google social" type="button" onClick={() => { window.location.href = "/api/auth/google"; }}>
          <img src="/icons/google.png" alt="" width={22} height={22} />
          Google로 계속하기
        </button>
        <div style={{ height: 8 }} />
        <button className="btn kakao social" type="button" onClick={() => { window.location.href = "/api/auth/kakao"; }}>
          <img src="/icons/kakao.png" alt="" width={22} height={22} />
          카카오로 계속하기
        </button>
        <div className="auth-foot">
          이미 계정이 있으신가요?  <Link href="/login">로그인</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
