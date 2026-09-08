"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Back, PhoneShell } from "@/components/ui";
import { PRIVACY, TERMS } from "@/lib/catalog";

function Inner() {
  const doc = useSearchParams().get("doc");
  const privacy = doc === "privacy";
  return (
    <PhoneShell>
      <div className="topbar">
        <Back />
        <h1>{privacy ? "개인정보처리방침" : "서비스 이용약관"}</h1>
        <span style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="legal">{privacy ? PRIVACY : TERMS}</div>
      </div>
    </PhoneShell>
  );
}

export default function TermsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
