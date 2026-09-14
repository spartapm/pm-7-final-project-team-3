"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BundleItemRow, BundleRow, ProductRow, ProviderRow } from "@/lib/catalog-db";

function Inner() {
  const type = useSearchParams().get("type");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [items, setItems] = useState<BundleItemRow[]>([]);
  useEffect(() => {
    fetch("/api/admin/session").then((r) => r.json()).then((d) => {
      setProviders(d.providers ?? []);
      setProducts(d.products ?? []);
      setBundles(d.bundles ?? []);
      setItems(d.items ?? []);
    }).catch(() => undefined);
  }, []);
  const nameOf = (id: number | null) => providers.find((p) => p.provider_id === id)?.provider_name ?? "-";
  const wonOf = (n: number | string | null | undefined) => `${(Number(n) || 0).toLocaleString("ko-KR")}원`;
  const solo = useMemo(
    () => products.filter((p) => (p.product_type || "단독") !== "결합" && (p.is_active || type !== "solo")),
    [products, type],
  );
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{type === "solo" ? "단독상품" : type === "bundle" ? "결합상품" : "전체 상품"}</h1>
          <p>시트에 없는 값은 등록 화면에서 이어서 넣으면 됩니다.</p>
        </div>
        <Link className="adm-btn primary" href="/admin/products/new">상품 등록</Link>
      </div>
      {type !== "bundle" ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 10px" }}>단독상품</h3>
          <table className="adm-table">
            <thead><tr><th>ID</th><th>상품명</th><th>제공사</th><th>카테고리</th><th>정가</th><th>상태</th></tr></thead>
            <tbody>
              {solo.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_id}</td>
                  <td><Link href={`/admin/products/new?solo=${p.product_id}`}>{p.product_name}</Link></td>
                  <td>{nameOf(p.provider_id)}</td>
                  <td>{p.category}</td>
                  <td>{wonOf(p.price_standard)}</td>
                  <td>{p.is_active ? "공개" : "임시"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {type !== "solo" ? (
        <div className="adm-card">
          <h3 style={{ margin: "0 0 10px" }}>결합상품</h3>
          <table className="adm-table">
            <thead><tr><th>ID</th><th>상품명</th><th>카드 제목</th><th>결합가</th><th>구성</th><th>상태</th></tr></thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.bundle_id}>
                  <td>{b.bundle_id}</td>
                  <td><Link href={`/admin/products/new?bundle=${b.bundle_id}`}>{b.bundle_name}</Link></td>
                  <td>{b.card_title}</td>
                  <td>{wonOf(b.price_bundled)}</td>
                  <td>{items.filter((i) => i.bundle_id === b.bundle_id).map((i) => i.product?.product_name).filter(Boolean).join(" · ")}</td>
                  <td>{b.is_active ? "공개" : "임시"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

export default function AdminProductsPage() {
  return <Suspense><Inner /></Suspense>;
}
