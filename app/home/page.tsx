"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand, Fab, Gate, Logo, PhoneShell, TabBar } from "@/components/ui";
import { PROMOS } from "@/lib/catalog";
import { dateLabel, monthLabel, relativeTime, thisWeek, won } from "@/lib/format";
import { leaksOf, monthlyAmount } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, subscriptions, events, notices, markNotice, markAllNotices, accountId, showToast, onboarded, setOnboarded } = useStore();
  const [promo, setPromo] = useState(0);
  const [day, setDay] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [invite, setInvite] = useState(false);
  const inviteCode = `TEUM-${(accountId || "guest").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "FRIEND"}`;

  const decideMarketing = (ok: boolean) => {
    const now = new Date();
    const stamp = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setOnboarded(ok);
    showToast(`⚠️  ${stamp} 기준으로 마케팅 알림 수신 ${ok ? "승인" : "거부"} 처리되었습니다.`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("invite") === "1") setInvite(true);
  }, []);
  useEffect(() => {
    if (PROMOS.length < 2) return;
    const t = setInterval(() => setPromo((p) => (p + 1) % PROMOS.length), 3000);
    return () => clearInterval(t);
  }, []);
  const live = subscriptions.filter((s) => s.status !== "ended" && !s.paused && !s.parentId);
  const monthPay = live.filter((s) => s.status !== "trial").reduce((a, s) => a + monthlyAmount(s.amount, s.cycle), 0);
  const leak = leaksOf(live);
  const week = useMemo(() => thisWeek(), []);
  const weekKeys = new Set(week.map((d) => d.key));
  const upcoming = live.filter((s) => weekKeys.has(s.nextPay)).sort((a, b) => a.nextPay.localeCompare(b.nextPay)).slice(0, 2);
  const unread = notices.filter((n) => !n.read).length;
  const marked = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of live) {
      const arr = map.get(s.nextPay) ?? [];
      arr.push("#3057F5");
      map.set(s.nextPay, arr);
      if (s.trialEnds && s.trialEnds !== s.nextPay) {
        const t = map.get(s.trialEnds) ?? [];
        t.push("#3057F5");
        map.set(s.trialEnds, t);
      }
    }
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push("#FF6B7F");
      map.set(e.date, arr);
    }
    return map;
  }, [live, events]);

  if (!hydrated) return <PhoneShell><div className="scroll" /></PhoneShell>;

  return (
    <Gate>
      <PhoneShell>
        <div className="scroll flush tabbed">
          <div className="home-hero">
            <div className="home-hero-top">
              <Logo light />
              <button className="bell" type="button" aria-label="알림" onClick={() => setSheet(true)}>
                <img src="/icons/bell.png" alt="" />
                {unread ? <span className="badge">{unread > 9 ? "9+" : unread}</span> : null}
              </button>
            </div>
            <div className="promo photo">
              <button
                type="button"
                onClick={() => {
                  const href = PROMOS[promo].href;
                  if (href) router.push(href);
                }}
                style={{ width: "100%" }}
              >
                <img className="promo-full" src={PROMOS[promo].image} alt="" />
              </button>
              {PROMOS.length > 1 ? (
                <div className="promo-nav">
                  <button type="button" onClick={() => setPromo((p) => (p + PROMOS.length - 1) % PROMOS.length)} aria-label="이전">‹</button>
                  <span className="dots">
                    {PROMOS.map((_, i) => <i key={i} className={i === promo ? "on" : ""} />)}
                  </span>
                  <button type="button" onClick={() => setPromo((p) => (p + 1) % PROMOS.length)} aria-label="다음">›</button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="week-card">
            <div className="mo">{monthLabel(new Date())}</div>
            <div className="week">
              {week.map((d) => (
                <button key={d.key} type="button" className={day === d.key || (!day && d.today) ? "on" : ""} onClick={() => { setDay(d.key); router.push(`/calendar?date=${d.key}`); }}>
                  <span>{d.dow}</span>
                  <span className="num">{d.date}</span>
                  <span className="marks">
                    {(marked.get(d.key) ?? []).slice(0, 3).map((c, i) => <i key={i} style={{ background: c }} />)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="home-body">
            <div className="overview">
              <div className="k">이번 달 구독비</div>
              <div className="amt">{won(monthPay)}</div>
              {live.length === 0 ? (
                <button className="ok-leak" type="button" onClick={() => router.push("/subscriptions/new")}>
                  <span className="leak-copy">아직 등록된 구독이 없어요</span>
                  <span className="cta">등록하기 ›</span>
                </button>
              ) : leak.count > 0 ? (
                <button className="leak" type="button" onClick={() => router.push("/inspect")}>
                  <span>●</span>
                  <span className="leak-copy">새는 구독 {leak.count}개 · 최대 {won(leak.save)} 절약</span>
                  <span className="cta">확인하기 ›</span>
                </button>
              ) : (
                <button className="ok-leak" type="button" onClick={() => router.push("/inspect")}>
                  <span className="leak-copy">틈이 없어요. 구독을 잘 관리하고 계시네요!</span>
                  <span className="cta">확인하기 ›</span>
                </button>
              )}
            </div>

            <div className="section-title">
              <span>MY 결제일{upcoming.length ? <span className="count-badge quiet">{upcoming.length}</span> : null}</span>
              <button className="linkish" type="button" onClick={() => router.push("/subscriptions")}>더보기 ›</button>
            </div>
            <div className="card">
              {upcoming.length === 0 ? (
                <div className="empty" style={{ background: "transparent", padding: 12 }}>예정된 결제가 없어요</div>
              ) : upcoming.map((s) => (
                <button key={s.id} className="row" type="button" onClick={() => router.push(`/subscriptions/${s.id}`)} style={{ width: "100%", textAlign: "left" }}>
                  <Brand name={s.name} color={s.color} logo={s.logo} />
                  <span className="grow">
                    <div style={{ fontWeight: 800 }}>{s.name}</div>
                    <div className="muted">{dateLabel(s.nextPay)} · {s.status === "trial" ? "무료체험 종료" : s.autoRenew ? "자동 결제" : "갱신"}</div>
                  </span>
                  <span className="price">{won(s.amount)}</span>
                </button>
              ))}
            </div>

            <button className="btn primary inspect-cta" type="button" onClick={() => router.push("/inspect")}>
              구독비 점검받기
            </button>
          </div>
        </div>
        <Fab />
        <TabBar />
        {sheet ? (
          <>
            <div className="sheet-back" onClick={() => setSheet(false)} />
            <div className="sheet side">
              <div className="sheet-head">
                <h2>알림</h2>
                <button className="icon-btn round" type="button" onClick={() => setSheet(false)} aria-label="닫기">✕</button>
              </div>
              {notices.filter((n) => !n.read).length === 0 ? (
                <div className="empty" style={{ textAlign: "center", padding: 24 }}>
                  <img className="teumki-illust" src="/teumki/alert.png" alt="" />
                  <h3 style={{ margin: "0 0 6px" }}>새로운 알림이 없어요</h3>
                  <p className="muted">모든 알림을 확인했어요</p>
                </div>
              ) : notices.filter((n) => !n.read).map((n) => (
                <div key={n.id} className={`notice-item ${n.read ? "" : "unread"}`}>
                  <Brand name={n.brand ?? "틈"} color={n.icon === "warn" ? "#ff7700" : n.icon === "gift" ? "#2576f2" : "#14171c"} logo={n.icon === "warn" ? "!" : n.icon === "gift" ? "🎁" : (n.brand ?? "틈").slice(0, 1)} />
                  <div className="grow">
                    <div><span className="t">{n.title}</span><span className="meta">{relativeTime(n.at)}</span></div>
                    <p>{n.body}</p>
                  </div>
                  <button className="mini" type="button" onClick={() => {
                    markNotice(n.id);
                    if (n.id === "nt_invite" || n.href.includes("invite")) {
                      setSheet(false);
                      setInvite(true);
                      return;
                    }
                    router.push(n.href);
                  }}>확인</button>
                </div>
              ))}
              {notices.some((n) => !n.read) ? (
                <button className="btn primary" type="button" onClick={() => markAllNotices()}>일괄 삭제</button>
              ) : null}
            </div>
          </>
        ) : null}
        {!onboarded ? (
          <div className="modal-back">
            <div className="modal voice-perm" onClick={(e) => e.stopPropagation()}>
              <img className="modal-mascot" src="/teumki/alert.png" alt="" />
              <h3>마케팅 광고 알림 수신 동의</h3>
              <p>더 많은 혜택 이벤트 정보 알려드려요.<br />허용 여부는 설정에서 언제든 바꿀 수 있어요</p>
              <div className="modal-actions">
                <button className="btn cancel" type="button" onClick={() => decideMarketing(false)}>알림 거부</button>
                <button className="btn primary" type="button" onClick={() => decideMarketing(true)}>알림 받기</button>
              </div>
            </div>
          </div>
        ) : null}
        {invite ? (
          <>
            <div className="sheet-back" onClick={() => setInvite(false)} />
            <div className="sheet">
              <div className="sheet-head">
                <h2>친구 초대</h2>
                <button className="icon-btn round" type="button" onClick={() => setInvite(false)} aria-label="닫기">✕</button>
              </div>
              <p className="muted">초대 코드를 공유하면 스타벅스 아메리카노 쿠폰을 받을 수 있어요.</p>
              <div className="invite-code">{inviteCode}</div>
              <button
                className="btn primary"
                type="button"
                onClick={async () => {
                  const text = `틈(TEUM) 친구 초대 코드 ${inviteCode}`;
                  await navigator.clipboard.writeText(text).catch(() => undefined);
                  showToast("초대 코드를 복사했어요.");
                }}
              >
                코드 복사
              </button>
            </div>
          </>
        ) : null}
      </PhoneShell>
    </Gate>
  );
}
