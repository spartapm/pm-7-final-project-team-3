"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SessionPage() {
  const router = useRouter();
  const { hydrated, loggedIn } = useStore();
  useEffect(() => {
    if (hydrated && loggedIn) router.replace("/home");
  }, [hydrated, loggedIn, router]);
  return (
    <PhoneShell>
      <div className="wait">
        <img className="teumki-illust" src="/teumki/shock.png" alt="" />
        <h2>로그인이 만료됐어요</h2>
        <p className="muted">안전한 이용을 위해 다시 로그인해주세요</p>
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            sessionStorage.removeItem("teum:session-expired");
            router.replace("/login");
          }}
        >
          다시 로그인
        </button>
      </div>
    </PhoneShell>
  );
}
