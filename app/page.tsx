"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Splash() {
  const router = useRouter();
  const { hydrated, loggedIn, onboarded } = useStore();
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (!loggedIn) router.replace("/login");
      else if (!onboarded) router.replace("/onboarding/alerts");
      else router.replace("/home");
    }, 1200);
    return () => clearTimeout(t);
  }, [hydrated, loggedIn, onboarded, router]);
  return (
    <PhoneShell>
      <div className="splash">
        <Logo large />
        <p className="slogan">구독도 일정도, 빈틈없이</p>
      </div>
    </PhoneShell>
  );
}
