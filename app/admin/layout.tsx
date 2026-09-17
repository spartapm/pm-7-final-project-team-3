"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import "./admin.css";

const NAV = [
  { href: "/admin", label: "대시보드", cap: "운영" },
  { href: "/admin/products", label: "전체 상품", cap: "상품 관리" },
  { href: "/admin/products?type=solo", label: "단독상품" },
  { href: "/admin/products?type=bundle", label: "결합상품" },
  { href: "/admin/products/new", label: "상품 등록" },
  { href: "/admin/categories", label: "카테고리 관리" },
  { href: "/admin/promotions", label: "할인 이벤트 관리", cap: "혜택" },
  { href: "/admin/providers", label: "제공사 관리" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/inquiries", label: "CS 문의", cap: "고객 지원" },
];

function Side() {
  const path = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();
  const full = search ? `${path}?${search}` : path;
  const onOf = (href: string) => {
    if (href === "/admin") return path === "/admin";
    if (href === "/admin/products/new") return path.startsWith("/admin/products/new");
    if (href === "/admin/products") return path === "/admin/products" && !search;
    if (href.includes("?")) return full === href;
    return path === href || path.startsWith(`${href}/`);
  };
  return (
    <aside className="adm-side">
      <div className="adm-brand">
        <img src="/brand/logo-banner-white.png" alt="" />
        틈 : TEUM
      </div>
      <nav className="adm-nav">
        {NAV.map((n) => (
          <span key={n.href}>
            {n.cap ? <div className="cap">{n.cap}</div> : null}
            <Link href={n.href} className={onOf(n.href) ? "on" : ""}>{n.label}</Link>
          </span>
        ))}
      </nav>
      <div style={{ marginTop: "auto" }}>
        <button
          className="nav"
          type="button"
          onClick={async () => {
            await fetch("/api/admin/session", { method: "DELETE" });
            router.replace("/admin/login");
          }}
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === "/admin/login") return <>{children}</>;
  return (
    <div className="adm-root">
      <Suspense fallback={<aside className="adm-side" />}>
        <Side />
      </Suspense>
      <div className="adm-main">{children}</div>
    </div>
  );
}
