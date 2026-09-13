"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../admin.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="adm-login">
      <form
        className="box"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const res = await fetch("/api/admin/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          setBusy(false);
          if (!res.ok) {
            setErr("비밀번호가 올바르지 않아요.");
            return;
          }
          router.replace("/admin");
        }}
      >
        <h1 style={{ margin: "0 0 8px" }}>틈 어드민</h1>
        <p style={{ margin: "0 0 16px", color: "#667085", fontSize: 13 }}>한상균 시트 값을 넣는 관리 화면입니다.</p>
        {err ? <p className="adm-err">{err}</p> : null}
        <div className="adm-field">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </div>
        <button className="adm-btn primary" type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "확인 중…" : "들어가기"}</button>
      </form>
    </div>
  );
}
