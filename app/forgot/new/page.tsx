"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";
import { passwordError } from "@/lib/validate";

export default function NewPwPage() {
  const router = useRouter();
  const { resetPassword, showToast } = useStore();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <PhoneShell>
      <div className="auth">
        <div className="topbar"><Back /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>새 비밀번호 설정</h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>10자 이상 영문 대·소문자, 숫자, 특수문자를 조합해 주세요.</p>
        <div className={`field inbox ${err ? "err" : ""}`}>
          <label>새 비밀번호</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="10자 이상 조합" maxLength={20} />
        </div>
        {err ? <div className="err-msg">{err}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={busy}
          onClick={async () => {
            const pe = passwordError(pw);
            setErr(pe);
            if (pe) return;
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
            showToast("비밀번호가 변경되었습니다.");
            router.replace("/forgot/done");
          }}
        >
          {busy ? "저장 중…" : "저장하기"}
        </button>
      </div>
    </PhoneShell>
  );
}
