"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BundleRow, ProductRow, PromotionRow, ProviderRow } from "@/lib/catalog-db";

export default function AdminHome() {
  const [data, setData] = useState<{ providers: ProviderRow[]; products: ProductRow[]; bundles: BundleRow[]; promotions: PromotionRow[]; status: string } | null>(null);
  useEffect(() => {
    fetch("/api/admin/session").then((r) => r.json()).then(setData).catch(() => undefined);
  }, []);
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>대시보드</h1>
          <p>사용자 구독은 기존 DB, 혜택·상품은 아래 카탈로그 테이블입니다.</p>
        </div>
        <Link className="adm-btn primary" href="/admin/products/new">상품 등록</Link>
      </div>
      <div className="adm-kpi">
        <div>제공사<b>{data?.providers.length ?? "-"}</b></div>
        <div>단독상품<b>{data?.products.length ?? "-"}</b></div>
        <div>결합상품<b>{data?.bundles.length ?? "-"}</b></div>
        <div>할인 이벤트<b>{data?.promotions.length ?? "-"}</b></div>
      </div>
      <div className="adm-card">
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          앱 혜택 화면은 결합상품이 <code>is_active</code>이면 DB에서 읽어 갑니다. 테이블이 없거나 비어 있으면 기존 코드 목록으로 폴백합니다.
          지금 상태: <b>{data?.status ?? "불러오는 중"}</b>
        </p>
      </div>
    </>
  );
}
