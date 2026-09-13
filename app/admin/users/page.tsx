"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<{ id: string; email: string; onboarded: boolean }[]>([]);
  const [note, setNote] = useState("불러오는 중…");
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setNote("클라이언트에 Supabase 키가 없어 목록을 못 읽습니다.");
      return;
    }
    sb.from("accounts").select("id, email, onboarded").order("email").then((res) => {
      if (res.error) setNote(res.error.message);
      else {
        setRows(res.data ?? []);
        setNote("");
      }
    });
  }, []);
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>사용자 관리</h1>
          <p>가입 계정은 기존 accounts 테이블입니다. 구독·일정 삭제는 앱의 탈퇴 플로우를 씁니다.</p>
        </div>
      </div>
      {note ? <p className="adm-err">{note}</p> : null}
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>ID</th><th>이메일</th><th>온보딩</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td>{r.id}</td><td>{r.email}</td><td>{r.onboarded ? "완료" : "미완료"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
