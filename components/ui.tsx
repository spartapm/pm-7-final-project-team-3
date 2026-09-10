"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { brandIcon } from "@/lib/brands";
import { useStore } from "@/lib/store";

export function PhoneShell({ children }: { children: ReactNode }) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 720px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <div className={desktop ? "stage desktop" : "stage mobile"}>
      {desktop ? (
        <>
          <img className="stage-bg" src="/web/web-background.png" alt="" />
          <img className="stage-logo" src="/brand/logo-slogan.png" alt="" />
          <img className="stage-mascot" src="/brand/teumki-side.png" alt="" />
        </>
      ) : null}
      <div className="phone">
        <div className="shell">
          <div className="shell-body">
            {children}
            <ToastHost />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BounceIfAuthed() {
  const { hydrated, loggedIn, onboarded } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    router.replace("/home");
  }, [hydrated, loggedIn, onboarded, router]);
  return null;
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
    if (!onboarded && !path.startsWith("/onboarding") && path !== "/home") router.replace("/home");
  }, [hydrated, loggedIn, onboarded, path, router]);
  if (!hydrated) return <PhoneShell><div className="scroll" /></PhoneShell>;
  if (!loggedIn) return <PhoneShell><div className="scroll" /></PhoneShell>;
  return <>{children}</>;
}

export function Logo({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  return (
    <span className={`home-brand ${large ? "lg" : ""} ${light ? "light" : ""}`} style={{ color: light ? "#fff" : "#16171b" }}>
      <img className="home-logo-img" src="/brand/home-logo.png" alt="" />
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
    { href: "/home", label: "홈", onSrc: "/nav/home-on.png", offSrc: "/nav/home-off.png" },
    { href: "/calendar", label: "캘린더", onSrc: "/nav/cal-on.png", offSrc: "/nav/cal-off.png" },
    { href: "/benefits", label: "혜택", onSrc: "/nav/gift-on.png", offSrc: "/nav/gift-off.png" },
    { href: "/me", label: "마이", onSrc: "/nav/me-on.png", offSrc: "/nav/me-off.png" },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const on = t.href === "/home"
          ? path === "/home" || path.startsWith("/subscriptions")
          : t.href === "/benefits"
            ? path === "/benefits" || path.startsWith("/benefits/") || path.startsWith("/inspect")
            : path === t.href || path.startsWith(t.href + "/");
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""}>
            <img className="tab-ico" src={on ? t.onSrc : t.offSrc} alt="" />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function bindChipDrag(el: HTMLElement | null) {
  if (!el) return () => undefined;
  let down = false;
  let x = 0;
  let left = 0;
  let moved = false;
  const onDown = (e: PointerEvent) => {
    down = true;
    moved = false;
    x = e.clientX;
    left = el.scrollLeft;
  };
  const onMove = (e: PointerEvent) => {
    if (!down) return;
    const dx = e.clientX - x;
    if (Math.abs(dx) > 10) {
      if (!moved) {
        moved = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      }
      el.scrollLeft = left - dx;
    }
  };
  const onUp = () => { down = false; };
  const onClick = (e: MouseEvent) => {
    if (!moved) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("click", onClick, true);
  return () => {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("click", onClick, true);
  };
}

export function ChipScroller({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => bindChipDrag(ref.current), []);
  return <div ref={ref} className="chip-row drag" style={style}>{children}</div>;
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
          <div className={`fab-tabs ${tab === "event" ? "life" : ""}`}>
            <button className={tab === "subscription" ? "on" : ""} type="button" onClick={() => setTab("subscription")}>구독</button>
            <button className={tab === "event" ? "on" : ""} type="button" onClick={() => setTab("event")}>일상</button>
          </div>
          <button className="fab-row" type="button" onClick={() => { sessionStorage.setItem("teum:ai-hint", tab === "subscription" ? "구독 관련 이미지입니다" : "일상 관련 이미지입니다"); go(`/add/image?kind=${tab}`); }}>
            <span className="ico-sq" style={{ background: "#7c6fef" }}>🖼</span>
            이미지로 추가
            <span style={{ marginLeft: "auto", color: "#c5cad3" }}>›</span>
          </button>
          <button className="fab-row" type="button" onClick={() => { sessionStorage.setItem("teum:ai-hint", tab === "subscription" ? "구독 관련 음성입니다" : "일상 관련 음성입니다"); go(`/add/voice?kind=${tab}`); }}>
            <span className="ico-sq" style={{ background: "#f0a202" }}>🎙</span>
            음성으로 추가
            <span style={{ marginLeft: "auto", color: "#c5cad3" }}>›</span>
          </button>
          <div className="fab-split" />
          <button
            className="fab-row"
            type="button"
            onClick={() => go(tab === "subscription" ? "/subscriptions/new" : "/events/new")}
          >
            <span className="ico-sq" style={{ background: "#2576f2" }}>☰</span>
            {tab === "subscription" ? "구독 직접 추가" : "일상 직접 추가"}
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
  mascot,
}: {
  title: string;
  body: string;
  cancel?: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  mascot?: string;
}) {
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {mascot ? <img className="modal-mascot" src={mascot} alt="" /> : null}
        <h3>{title}</h3>
        {body ? <p>{body}</p> : null}
        <div className="modal-actions">
          <button className="btn cancel" type="button" onClick={onCancel}>{cancel}</button>
          <button className={`btn ${danger ? "danger" : "primary"}`} type="button" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </div>
  );
}

export function Brand({ name, color, logo }: { name: string; color: string; logo: string }) {
  const src = brandIcon(name);
  return (
    <span className="brand" style={src ? undefined : { background: color }} aria-hidden>
      {src ? <img src={src} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : (logo || name.slice(0, 1))}
    </span>
  );
}
