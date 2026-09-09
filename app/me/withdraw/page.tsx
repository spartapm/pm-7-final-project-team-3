"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

const REASONS = [
  "더 이상 안 써요",
  "개인정보가 걱정돼요",
  "다른 서비스로 옮겨요",
  "오류가 생겨서 쓸 수가 없어요",
  "방문 빈도가 낮아요",
  "기타",
];

const SECTIONS = [
  { title: "1. 서비스 이용 종료", body: "회원탈퇴가 완료되면 틈 계정과 서비스 이용이 즉시 종료되며, 로그인이 불가능합니다." },
  { title: "2. 이용정보 삭제", body: "탈퇴 시 프로필, 등록한 구독·결제정보, 개인 일정, 일정 색상, 메모, 알림 설정, 혜택 확인 내역, AI·이미지·음성 분석 결과 등 틈에서 작성하거나 저장한 모든 정보가 삭제됩니다. 삭제된 정보는 복구하거나 이전 상태로 되돌릴 수 없습니다." },
  { title: "3. 데이터 삭제", body: "탈퇴 후 동일한 이메일 또는 소셜 계정으로 다시 가입하더라도 이전에 등록한 구독과 일정은 복구되지 않습니다. 필요한 정보는 탈퇴 전에 별도로 저장해주세요." },
  { title: "4. 재 가입 안내", body: "회원탈퇴 후 별도의 제한 기간 없이, 동일한 이메일 또는 소셜 계정으로 바로 재가입할 수 있습니다. 재가입 시에는 이전 계정의 데이터와 연결되지 않으며, 새로운 계정으로 시작됩니다." },
  { title: "5. 법령에 따른 보관", body: "관계 법령에 따라 보존이 필요한 정보는 정해진 기간 동안 다른 정보와 분리하여 보관하며, 보관기간이 끝나면 복구할 수 없는 방법으로 파기합니다." },
];

export default function WithdrawPage() {
  const router = useRouter();
  const { hydrated, loggedIn, withdraw } = useStore();
  const [sheet, setSheet] = useState<"reason" | "done" | null>(null);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn && sheet !== "done") router.replace("/login");
  }, [hydrated, loggedIn, sheet, router]);

  const otherOk = other.trim().length >= 1 && other.trim().length <= 100;
  const canLeave = reason !== "" && (reason !== "기타" || otherOk);

  const finish = () => {
    withdraw();
    router.replace("/login");
  };

  return (
    <PhoneShell>
      <div className="topbar">
        <Back href="/me" />
        <h1>회원탈퇴 및 데이터 삭제 안내</h1>
        <span style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="withdraw-note">
          <span className="must">필수</span>
          <p>회원탈퇴 시 모든 이용정보가 삭제되며 복구할 수 없음을 확인했습니다.</p>
        </div>
        <div className="withdraw-card">
          {SECTIONS.map((s, i) => (
            <div key={s.title}>
              {i > 0 ? <hr /> : null}
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <p className="legal-brand">TRI:ON · 틈</p>
        <div className="withdraw-foot">
          <button className="btn ghost" type="button" onClick={() => router.push("/me")}>취소</button>
          <button className="btn primary" type="button" onClick={() => setSheet("reason")}>탈퇴하기</button>
        </div>
      </div>
      {sheet === "reason" ? (
        <>
          <div className="sheet-back" onClick={() => { setSheet(null); setReason(""); setOther(""); }} />
          <div className="sheet">
            <h2 className="reason-title">탈퇴하시는 이유를 알려주세요.</h2>
            {REASONS.map((r) => (
              <button
                key={r}
                className={`reason ${reason === r ? "on" : ""}`}
                type="button"
                onClick={() => setReason(r)}
              >
                <i className="reason-dot" />
                {r}
              </button>
            ))}
            {reason === "기타" ? (
              <textarea
                className="reason-input"
                maxLength={100}
                placeholder="사유를 작성해주세요."
                value={other}
                onChange={(e) => setOther(e.target.value.slice(0, 100))}
              />
            ) : null}
            <div className="withdraw-foot" style={{ marginTop: 16 }}>
              <button className="btn ghost" type="button" onClick={() => { setSheet(null); setReason(""); setOther(""); }}>취소</button>
              <button
                className="btn primary"
                type="button"
                disabled={!canLeave}
                onClick={() => { withdraw(); setSheet("done"); }}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </>
      ) : null}
      {sheet === "done" ? (
        <>
          <div className="sheet-back" onClick={finish} />
          <div className="sheet">
            <h2 className="reason-title">탈퇴가 완료되었습니다.</h2>
            <p className="reason-done">
              그동안 함께해 주셔서 감사합니다.
              남겨주신 이야기는 더 나은 서비스를 만드는 데 소중히 쓰겠습니다.
              다시 만나뵙기를 기다리고 있겠습니다.
            </p>
            <button className="btn primary" type="button" onClick={finish}>닫기</button>
          </div>
        </>
      ) : null}
    </PhoneShell>
  );
}
