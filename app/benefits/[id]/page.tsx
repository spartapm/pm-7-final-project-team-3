"use client";

import { use } from "react";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { BENEFITS } from "@/lib/catalog";

export default function BenefitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const b = BENEFITS.find((x) => x.id === id);
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/benefits" /><h1>혜택 상세</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          {!b ? (
            <div className="empty">혜택을 찾을 수 없어요.</div>
          ) : (
            <>
              <span className="tag" style={{ background: b.providerColor }}>{b.provider}</span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "10px 0" }}>{b.title}</h2>
              <p className="muted" style={{ lineHeight: 1.55 }}>{b.body}</p>
              {b.expires ? <p className="muted" style={{ marginTop: 8 }}>{b.expires} 만료 예정</p> : null}
              <div className="card" style={{ marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                  혜택 제공처와 실제 이용 서비스가 다를 수 있어요. 틈에서는 해지나 요금제 변경을 대행하지 않으니, 공식 서비스에서 직접 확인해 주세요.
                </p>
              </div>
              <div style={{ height: 16 }} />
              <a className="btn primary" href={b.href} target="_blank" rel="noreferrer">공식 서비스로 이동</a>
            </>
          )}
        </div>
      </PhoneShell>
    </Gate>
  );
}
