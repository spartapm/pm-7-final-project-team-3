"use client";

import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell } from "@/components/ui";
import { categorySelectOptions } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export default function AddConfirm() {
  const router = useRouter();
  const { draft, setDraft } = useStore();
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back /><h1>인식 확인</h1><span style={{ width: 36 }} /></div>
        <div className="scroll">
          <div className="cold-bar" style={{ marginBottom: 14 }}>AI 초안입니다. 저장하기 전에는 내 구독에 들어가지 않아요.</div>
          <div className="field"><label>서비스</label><input value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} /></div>
          <div className="field"><label>요금제</label><input value={draft.plan} onChange={(e) => setDraft({ plan: e.target.value })} /></div>
          <div className="field">
            <label>카테고리</label>
            <select value={draft.category} onChange={(e) => setDraft({ category: e.target.value as typeof draft.category })}>
              {categorySelectOptions(draft.category).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="field"><label>결제 금액</label><input value={draft.amount} onChange={(e) => setDraft({ amount: e.target.value })} /></div>
          <div className="field"><label>다음 결제일</label><input type="date" value={draft.nextPay} onChange={(e) => setDraft({ nextPay: e.target.value })} /></div>
          <button className="btn primary" type="button" onClick={() => router.push("/subscriptions/new")}>수정하고 저장</button>
        </div>
      </PhoneShell>
    </Gate>
  );
}
