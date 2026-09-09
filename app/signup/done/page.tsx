"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";

export default function SignupDone() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="done-screen">
        <img className="done-mascot" src="/teumki/joa.png" alt="" />
        <h1>가입이 완료되었습니다.</h1>
        <p>지금 바로 새는 구독비를 확인하러 가볼까요?</p>
        <div style={{ height: 24 }} />
        <button className="btn primary" type="button" onClick={() => router.replace("/login")}>
          로그인 하러 가기
        </button>
      </div>
    </PhoneShell>
  );
}
