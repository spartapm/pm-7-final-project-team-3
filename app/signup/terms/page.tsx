"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Back, PhoneShell } from "@/components/ui";
import { LEGAL, LEGAL_INDEX, isLegalKey, type LegalBlock, type LegalDoc } from "@/lib/legal";

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "p") return <p key={i}>{b.text}</p>;
        if (b.type === "quote") return <p key={i} className="legal-quote">{b.text}</p>;
        if (b.type === "ul") {
          return (
            <ul key={i} className="legal-ul">
              {b.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          );
        }
        return (
          <div key={i} className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>{b.headers.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((row, ri) => (
                  <tr key={ri}>{row.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

function DocView({ item, back }: { item: LegalDoc; back: string }) {
  const router = useRouter();
  return (
    <>
      <h2>{item.title}</h2>
      <p className="legal-date"><span className="legal-chip">{item.badge}</span>{item.lead}</p>
      <div className="legal-card">
        {item.articles.map((a, i) => (
          <div key={`${a.title}-${i}`} className="legal-article">
            {a.title ? <h3>{a.title}</h3> : null}
            <Blocks blocks={a.blocks} />
          </div>
        ))}
      </div>
      <p className="legal-brand">TRI:ON · 틈</p>
      <button className="btn primary" type="button" onClick={() => router.push(back)}>확인</button>
    </>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("doc");
  const fromMe = params.get("from") === "me";
  const back = fromMe ? "/me" : "/signup";
  const showIndex = fromMe && (!raw || raw === "index");
  const item = isLegalKey(raw) ? LEGAL[raw] : LEGAL.terms;

  return (
    <PhoneShell>
      <div className="topbar">
        <Back href={showIndex ? "/me" : (fromMe ? "/signup/terms?from=me" : "/signup")} />
        <h1>{showIndex ? "약관 및 동의서" : item.title}</h1>
        <span style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="legal-page">
          {showIndex ? (
            <>
              <h2>약관 및 동의서</h2>
              <p className="legal-date">틈_약관_동의서_통합본 기준</p>
              <div className="menu">
                {LEGAL_INDEX.map((d) => (
                  <Link key={d.key} href={`/signup/terms?doc=${d.key}&from=me`}>{d.label} <span>›</span></Link>
                ))}
              </div>
              <div style={{ height: 16 }} />
              <button className="btn primary" type="button" onClick={() => router.push("/me")}>확인</button>
            </>
          ) : (
            <DocView item={fromMe || isLegalKey(raw) ? item : LEGAL.terms} back={fromMe ? "/signup/terms?from=me" : back} />
          )}
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
