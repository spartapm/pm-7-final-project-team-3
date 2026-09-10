"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BENEFITS } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export default function BenefitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useStore();
  const b = BENEFITS.find((x) => x.id === id);
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/benefits" /><h1>혜택 상세</h1><span style={{ width: 36 }} /></div>
        <div className="scroll tabbed">
          {!b ? (
            <div className="empty">혜택을 찾을 수 없어요.</div>
          ) : (
            <>
              <div className="card">
                <span className="tag" style={{ background: b.providerColor }}>{b.provider}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 8px" }}>{b.title}</h2>
                <p className="muted" style={{ lineHeight: 1.55, margin: 0 }}>{b.body}</p>
                {b.expires ? <p className="muted" style={{ marginTop: 8 }}>{b.expires} 만료 예정</p> : null}
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>신청 방법</div>
                <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  {b.howTo || "공식 서비스에서 혜택을 신청한 뒤, 틈 구독 목록에 등록해 주세요."}
                </p>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>이용 조건</div>
                <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  {b.terms || "실제 할인·제공 여부는 혜택 제공처 정책에 따릅니다. 틈에서는 해지나 요금제 변경을 대행하지 않아요."}
                </p>
              </div>
              <div style={{ height: 16 }} />
              <a
                className="btn primary"
                href={b.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!b.href) {
                    e.preventDefault();
                    showToast("공식 서비스로 이동하지 못했어요.", "err");
                  }
                }}
              >
                공식 서비스로 이동
              </a>
              <div style={{ height: 8 }} />
              <button className="btn ghost" type="button" onClick={() => router.push("/benefits")}>혜택 메인으로</button>
            </>
          )}
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
