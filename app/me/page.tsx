"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gate, Modal, PhoneShell, TabBar } from "@/components/ui";
import { useStore } from "@/lib/store";

const MVP = "MVP 범위 밖 입니다 추후 실 서비스에서 뵙겠습니다.";

export default function MePage() {
  const router = useRouter();
  const { email, logout, showToast } = useStore();
  const [out, setOut] = useState(false);
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar left hero"><h1>마이페이지</h1></div>
        <div className="scroll tabbed">
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img className="me-avatar" src="/teumki/selfie.png" alt="" />
            <div className="grow">
              <div className="email-clip" style={{ fontWeight: 800 }}>{email || "example123@gmail.com"}</div>
              <button className="linkish" type="button" onClick={() => setOut(true)}>로그아웃</button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">계정</div>
            <div className="menu">
              <button type="button" className="off" onClick={() => showToast(MVP, "info")}>프로필 수정 <span className="soon">준비 중</span></button>
              <button type="button" onClick={() => router.push("/me/alerts")}>알림 설정 <span>›</span></button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">데이터</div>
            <div className="menu">
              <button type="button" className="off" onClick={() => showToast(MVP, "info")}>서비스 연동 & 해제 <span className="soon">준비 중</span></button>
            </div>
          </div>
          <div className="menu-group">
            <div className="k">지원</div>
            <div className="menu">
              <button type="button" onClick={() => router.push("/signup/terms?doc=terms&from=me")}>이용약관 및 개인정보처리방침 <span>›</span></button>
              <button className="danger-txt" type="button" onClick={() => router.push("/me/withdraw")}>계정 탈퇴 <span>›</span></button>
            </div>
          </div>
          <p className="version-foot">앱 버전 0.1.0</p>
        </div>
        <TabBar />
        {out ? (
          <Modal
            title="로그아웃 하시겠어요?"
            body=""
            confirm="로그아웃"
            mascot="/teumki/sad.png"
            onCancel={() => setOut(false)}
            onConfirm={() => { logout(); router.replace("/login"); }}
          />
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
