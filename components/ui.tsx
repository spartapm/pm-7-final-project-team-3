"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <div className="shell-body">
        {children}
        <ToastHost />
      </div>
    </div>
  );
}

export function Gate({ children }: { children: ReactNode }) {
  const { hydrated, loggedIn, onboarded } = useStore();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) {
      const expired = typeof window !== "undefined" && sessionStorage.getItem("teum:session-expired") === "1";
      router.replace(expired ? "/session" : "/login");
      return;
    }
    if (!onboarded && !path.startsWith("/onboarding")) router.replace("/onboarding/alerts");
  }, [hydrated, loggedIn, onboarded, path, router]);
  if (!hydrated) return <PhoneShell><div className="scroll" /></PhoneShell>;
  if (!loggedIn) return <PhoneShell><div className="scroll" /></PhoneShell>;
  return <>{children}</>;
}

export function Logo({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  return (
    <span className={`home-brand ${large ? "lg" : ""}`} style={{ color: light ? "#fff" : "#16171b" }}>
      <span className="logo-mark" aria-hidden>
        <i className="bar" />
        <i className="gap" />
        <i className="bar" />
      </span>
      <span className="logo-word">틈</span>
    </span>
  );
}

export function Back({ href, onClick }: { href?: string; onClick?: () => void }) {
  const router = useRouter();
  return (
    <button
      className="icon-btn"
      type="button"
      aria-label="뒤로가기"
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
        else router.back();
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 6 9 12l6 6" />
      </svg>
    </button>
  );
}

export function TabBar() {
  const path = usePathname();
  const tabs = [
    { href: "/home", label: "홈", icon: HomeIco },
    { href: "/calendar", label: "캘린더", icon: CalIco },
    { href: "/benefits", label: "혜택", icon: GiftIco },
    { href: "/me", label: "마이", icon: UserIco },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const on = path === t.href || path.startsWith(t.href + "/");
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""}>
            <Icon on={on} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIco({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function CalIco({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}
function GiftIco({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="10" width="18" height="10" rx="1.5" />
      <path d="M3 10h18M12 10v10M12 10c-2-3-5-4-6-2s1 3 6 2M12 10c2-3 5-4 6-2s-1 3-6 2" />
    </svg>
  );
}
function UserIco({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.6-3 4-4.5 7-4.5S17.4 16 19 19" />
    </svg>
  );
}

export function Fab({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"subscription" | "event">("subscription");
  const router = useRouter();
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  return (
    <>
      {open ? <div className="sheet-back" onClick={() => setOpen(false)} /> : null}
      {open ? (
        <div className="fab-menu">
          <h3>일정 추가하기</h3>
          <div className="fab-tabs">
            <button className={tab === "subscription" ? "on" : ""} type="button" onClick={() => setTab("subscription")}>구독</button>
            <button className={tab === "event" ? "on" : ""} type="button" onClick={() => setTab("event")}>일상</button>
          </div>
          <button className="fab-row" type="button" onClick={() => go(`/add/image?kind=${tab}`)}>
            <span className="ico-sq" style={{ background: "#7c6fef" }}>🖼</span>
            이미지로 추가
            <span style={{ marginLeft: "auto", color: "#c5cad3" }}>›</span>
          </button>
          <button className="fab-row" type="button" onClick={() => go(`/add/voice?kind=${tab}`)}>
            <span className="ico-sq" style={{ background: "#f0a202" }}>🎙</span>
            음성으로 추가
            <span style={{ marginLeft: "auto", color: "#c5cad3" }}>›</span>
          </button>
          <button
            className="fab-row"
            type="button"
            onClick={() => go(tab === "subscription" ? "/subscriptions/new" : "/events/new")}
          >
            <span className="ico-sq" style={{ background: "#2576f2" }}>☰</span>
            {tab === "subscription" ? "구독 직접 추가" : "일상 일정 직접 추가"}
            <span style={{ marginLeft: "auto", color: "#c5cad3" }}>›</span>
          </button>
        </div>
      ) : null}
      <button className={`fab ${open ? "open" : ""}`} type="button" aria-label="추가" onClick={() => setOpen((v) => !v)}>
        +
      </button>
      {children}
    </>
  );
}

export function ToastHost() {
  const { toast, clearToast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);
  if (!toast) return null;
  return <div className={`toast ${toast.kind}`}>{toast.message}</div>;
}

export function Modal({
  title,
  body,
  cancel = "취소",
  confirm,
  onCancel,
  onConfirm,
  danger,
}: {
  title: string;
  body: string;
  cancel?: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <div className="modal-back">
      <div className="modal">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="modal-actions">
          <button className="btn cancel" type="button" onClick={onCancel}>{cancel}</button>
          <button className={`btn ${danger ? "danger" : "primary"}`} type="button" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </div>
  );
}

export function Brand({ name, color, logo }: { name: string; color: string; logo: string }) {
  return (
    <span className="brand" style={{ background: color }} aria-hidden>
      {logo || name.slice(0, 1)}
    </span>
  );
}
