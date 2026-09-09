"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PASSWORD_HINT, passwordError } from "@/lib/validate";

export default function NewPwPage() {
  const router = useRouter();
  const { resetPassword, showToast } = useStore();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [cErr, setCErr] = useState("");
  const [pwFocus, setPwFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar"><Back href="/forgot/verify" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>새 비밀번호를 설정해주세요</h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>10자 이상 영문(대·소문자)·숫자·특수문자를 조합해주세요</p>
        <div className={`field inbox ${err ? "err" : ""}`}>
          <label>새 비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(""); }}
            onFocus={() => setPwFocus(true)}
            onBlur={() => setPwFocus(false)}
            placeholder="비밀번호 입력"
            maxLength={20}
          />
        </div>
        {err ? <div className="err-msg">{err}</div> : pwFocus ? <div className="field-hint">{PASSWORD_HINT}</div> : null}
        <div className={`field inbox ${cErr ? "err" : ""}`}>
          <label>비밀번호 확인</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setCErr(""); }}
            placeholder="비밀번호 다시 입력"
            maxLength={20}
          />
        </div>
        {cErr ? <div className="err-msg">{cErr}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={busy}
          onClick={async () => {
            const pe = passwordError(pw);
            setErr(pe);
            if (pe) return;
            if (pw !== confirm) {
              setCErr("비밀번호와 일치하지 않습니다. 다시 확인해주세요.");
              return;
            }
            const email = sessionStorage.getItem("teum:reset-email");
            if (!email) {
              showToast("인증 정보가 없어요. 다시 시도해 주세요.", "err");
              router.replace("/forgot");
              return;
            }
            setBusy(true);
            const res = await resetPassword(email, pw);
            setBusy(false);
            if (!res.ok) {
              showToast(res.error ?? "비밀번호 변경에 실패했습니다.", "err");
              return;
            }
            router.replace("/forgot/done");
          }}
        >
          {busy ? "저장 중…" : "비밀번호 변경"}
        </button>
      </div>
    </PhoneShell>
  );
}
