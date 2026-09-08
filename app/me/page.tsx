"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gate, Modal, PhoneShell, TabBar } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MePage() {
  const router = useRouter();
  const { email, logout, withdraw, showToast } = useStore();
  const [out, setOut] = useState(false);
  const [del, setDel] = useState(false);
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar left hero"><h1>마이페이지</h1></div>
        <div className="scroll tabbed">
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="brand" style={{ width: 56, height: 56, borderRadius: 28, background: "#2576f2", fontSize: 18 }}>틈</span>
            <div className="grow">
              <div className="email-clip" style={{ fontWeight: 800 }}>{email || "example123@gmail.com"}</div>
              <button className="linkish" type="button" onClick={() => setOut(true)}>로그아웃</button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">계정</div>
            <div className="menu">
              <button type="button" className="off" onClick={() => showToast("프로필 수정은 이후 버전에 열려요.", "info")}>프로필 수정 <span className="soon">준비 중</span></button>
              <button type="button" onClick={() => router.push("/me/alerts")}>알림 설정 <span>›</span></button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">데이터</div>
            <div className="menu">
              <button type="button" className="off" onClick={() => showToast("마이데이터 연동은 MVP 범위 밖입니다.", "info")}>서비스 연동 <span className="soon">준비 중</span></button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">지원</div>
            <div className="menu">
              <button type="button" onClick={() => router.push("/signup/terms?doc=terms")}>이용약관 및 개인정보처리방침 <span>›</span></button>
              <button type="button" onClick={() => setDel(true)}>회원탈퇴 및 데이터 삭제 안내 <span>›</span></button>
            </div>
          </div>
        </div>
        <TabBar />
        {out ? (
          <Modal
            title="로그아웃 하시겠어요?"
            body="다시 로그인하면 같은 기기에서 구독 기록을 이어서 볼 수 있어요."
            confirm="로그아웃"
            onCancel={() => setOut(false)}
            onConfirm={() => { logout(); router.replace("/login"); }}
          />
        ) : null}
        {del ? (
          <Modal
            title="탈퇴하고 데이터를 삭제할까요?"
            body="계정과 구독·일정·알림 기록이 즉시 삭제됩니다. 실제 구독 해지는 각 서비스에서 직접 해야 해요."
            confirm="탈퇴"
            danger
            onCancel={() => setDel(false)}
            onConfirm={() => { withdraw(); showToast("탈퇴가 완료되었습니다."); router.replace("/login"); }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
