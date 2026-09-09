"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function OnboardAlerts() {
  const router = useRouter();
  const { hydrated, loggedIn } = useStore();
  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) router.replace("/login");
    else router.replace("/home");
  }, [hydrated, loggedIn, router]);
  return <PhoneShell><div className="scroll" /></PhoneShell>;
}
