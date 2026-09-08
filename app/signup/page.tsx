"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { emailError, signupPasswordError } from "@/lib/validate";

export default function SignupPage() {
  const router = useRouter();
  const { signup, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [eErr, setEErr] = useState("");
  const [pErr, setPErr] = useState("");

  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const ee = emailError(email);
    const pe = signupPasswordError(password);
    setEErr(ee);
    setPErr(pe);
    if (ee || pe) return;
    if (!terms || !privacy) {
      showToast("필수 약관에 동의해 주세요.", "err");
      return;
    }
    setBusy(true);
    const res = await signup(email, password, marketing);
    setBusy(false);
    if (!res.ok) {
      showToast(res.error ?? "가입에 실패했습니다.", "err");
      return;
    }
    router.push("/signup/done");
  };

  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar">
          <Back href="/login" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 6px" }}>회원가입</h1>
        <p className="muted" style={{ marginBottom: 20 }}>이메일로 간편하게 시작하세요.</p>
        <div className={`field inbox ${eErr ? "err" : ""}`}>
          <label>이메일</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" autoCapitalize="none" maxLength={30} />
        </div>
        {eErr ? <div className="err-msg">{eErr}</div> : null}
        <div className={`field inbox ${pErr ? "err" : ""}`}>
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="10자 이상 조합" maxLength={20} />
        </div>
        {pErr ? <div className="err-msg">{pErr}</div> : null}
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>[필수] 서비스 이용약관 동의 <Link className="linkish" href="/signup/terms?doc=terms">보기</Link></span>
        </label>
        <label className="check">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>[필수] 개인정보처리방침 동의 <Link className="linkish" href="/signup/terms?doc=privacy">보기</Link></span>
        </label>
        <label className="check">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span>[선택] 마케팅 알림 수신 동의</span>
        </label>
        <div style={{ height: 16 }} />
        <button className="btn primary" type="button" onClick={submit} disabled={busy}>{busy ? "가입 중…" : "가입하기"}</button>
        <div className="auth-foot">
          이미 계정이 있으신가요?  <Link href="/login">로그인</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
