"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Brand, Fab, Gate, PhoneShell, TabBar } from "@/components/ui";
import { BENEFITS, CATEGORIES, benefitStatus, isBundleLike } from "@/lib/catalog";
import { cycleEvery, dateLabel, dueBadge, dueLabel, won } from "@/lib/format";
import { monthlyAmount } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";

type SortKey = "pay" | "amountDesc" | "amountAsc" | "newest" | "status";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "pay", label: "결제일 순" },
  { id: "amountDesc", label: "금액 높은 순" },
  { id: "amountAsc", label: "금액 낮은 순" },
  { id: "newest", label: "최신 순" },
  { id: "status", label: "이용 상태 순" },
];

function statusRank(s: { paused: boolean; status: string }) {
  if (s.paused || s.status === "paused") return 2;
  if (s.status === "trial") return 1;
  return 0;
}

function catLabel(id: Category | "all") {
  if (id === "all") return "전체";
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export default function SubListPage() {
  const router = useRouter();
  const { subscriptions } = useStore();
  const [cat, setCat] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortKey>("pay");
  const [sortOpen, setSortOpen] = useState(false);
  const live = subscriptions.filter((s) => s.status !== "ended");
  const list = live
    .filter((s) => cat === "all" || catLabel(s.category) === catLabel(cat))
    .slice()
    .sort((a, b) => {
      if (sort === "pay") return a.nextPay.localeCompare(b.nextPay);
      if (sort === "amountDesc") return b.amount - a.amount;
      if (sort === "amountAsc") return a.amount - b.amount;
      if (sort === "newest") return b.createdAt - a.createdAt;
      return statusRank(a) - statusRank(b);
    });
  const next = live.filter((s) => !s.paused).slice().sort((a, b) => a.nextPay.localeCompare(b.nextPay))[0];
  const benefitCheck = BENEFITS.filter((b) => benefitStatus(b, live) !== "owned").length;
  const cats = useMemo(() => {
    const used = new Set(live.map((s) => s.category));
    return [{ id: "all" as const, label: "전체" }, ...CATEGORIES.filter((c) => used.has(c.id))];
  }, [live]);
  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? "결제일 순";

  return (
    <Gate>
      <PhoneShell>
        <div className="topbar">
          <Back href="/home" />
          <h1>내 구독</h1>
          <span style={{ width: 40 }} />
        </div>
        <div className="scroll tabbed flush-x">
          <div className="sub-hero">
            <div className="muted" style={{ color: "#2576f2", fontWeight: 700 }}>구독 관리</div>
            <h2 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800 }}>
              {live.length === 0 ? "아직 등록된 구독이 없어요" : `구독 ${live.length}개를 관리 중이에요`}
            </h2>
            <p className="muted" style={{ marginBottom: 14 }}>
              {next ? `다음 결제는 ${dateLabel(next.nextPay)} ${next.name}예요.` : "구독을 추가하면 결제일이 여기에 모여요."}
            </p>
            {live.length > 0 ? (
              <div className="summary-grid">
                <div className="card tight">
                  <div className="muted">다음 결제</div>
                  <div className="sum-row">
                    <span className="sum-num">{next ? dueLabel(next.nextPay) : "없음"}</span>
                    <span className="sum-link">{next ? next.name : ""}</span>
                  </div>
                </div>
                <button className="card tight" type="button" onClick={() => router.push("/benefits")} style={{ textAlign: "left" }}>
                  <div className="muted">확인할 혜택</div>
                  <div className="sum-row">
                    <span className="sum-num" style={{ color: "#2576f2" }}>{benefitCheck}개</span>
                    <span className="sum-link">확인하기</span>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
          <div className="sub-body">
            <div className="chip-row" style={{ marginBottom: 4 }}>
              {cats.map((c) => (
                <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} type="button" onClick={() => setCat(c.id as Category | "all")}>{c.label}</button>
              ))}
            </div>
            <div className="list-head">
              <span>등록된 구독</span>
              {live.length > 0 ? (
                <button className="sort-btn" type="button" onClick={() => setSortOpen(true)}>{sortLabel} ▾</button>
              ) : null}
            </div>
            {list.length === 0 ? (
              <div className="empty">등록된 구독이 없어요.</div>
            ) : list.map((s) => {
              const overdue = s.paused || s.status === "paused" ? null : dueBadge(s.nextPay);
              return (
                <button key={s.id} className="sub-item" type="button" onClick={() => router.push(`/subscriptions/${s.id}`)}>
                  <Brand name={s.name} color={s.color} logo={s.logo} />
                  <span className="grow">
                    <div style={{ fontWeight: 800 }}>
                      {s.name}
                      {isBundleLike(s) ? <span className="bundle-tag">결합 상품</span> : null}
                    </div>
                    <div className="muted">{dateLabel(s.nextPay)} · {cycleEvery(s.cycle)}</div>
                  </span>
                  <span className="sub-item-right">
                    <span className="price">{won(s.amount)}</span>
                    {s.paused || s.status === "paused" ? (
                      <span className="d-badge pause">일시정지</span>
                    ) : s.status === "trial" ? (
                      <span className="d-badge trial">무료체험</span>
                    ) : overdue ? (
                      <span className="d-badge">{overdue}</span>
                    ) : null}
                  </span>
                  <span className="chev">›</span>
                </button>
              );
            })}
          </div>
        </div>
        <Fab />
        <TabBar />
        {sortOpen ? (
          <>
            <div className="sheet-back" onClick={() => setSortOpen(false)} />
            <div className="sheet">
              <div className="sheet-head">
                <h2>정렬</h2>
                <button className="icon-btn round" type="button" onClick={() => setSortOpen(false)} aria-label="닫기">✕</button>
              </div>
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  className={`sort-option ${sort === s.id ? "on" : ""}`}
                  type="button"
                  onClick={() => { setSort(s.id); setSortOpen(false); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
