"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Back, PhoneShell } from "@/components/ui";
import { AGE, MARKETING, PRIVACY, TERMS } from "@/lib/catalog";

const DOCS: Record<string, { title: string; body: string }> = {
  terms: { title: "서비스 이용약관", body: TERMS },
  privacy: { title: "개인정보 수집·이용", body: PRIVACY },
  marketing: { title: "혜택·이벤트 정보 수신", body: MARKETING },
  age: { title: "만 14세 이상 확인", body: AGE },
};

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const doc = params.get("doc") ?? "terms";
  const back = params.get("from") === "me" ? "/me" : "/signup";
  const item = DOCS[doc] ?? DOCS.terms;
  return (
    <PhoneShell>
      <div className="topbar">
        <Back href={back} />
        <h1>{item.title}</h1>
        <span style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="legal-page">
          <h2>{item.title}</h2>
          <p className="legal-date">시행일 2026.09.01</p>
          <div className="legal-card">{item.body.replace(/^[^\n]+\n+(시행일[^\n]+\n+)?/, "")}</div>
          <p className="legal-brand">TRI:ON · 틈</p>
          <button className="btn primary" type="button" onClick={() => router.push(back)}>확인</button>
        </div>
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
