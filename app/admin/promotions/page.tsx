"use client";

import { useEffect, useState } from "react";
import type { ProductRow, PromotionRow } from "@/lib/catalog-db";

export default function AdminPromotionsPage() {
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [discount, setDiscount] = useState("");
  const [end, setEnd] = useState("");
  const [err, setErr] = useState("");
  const load = () => fetch("/api/admin/session").then((r) => r.json()).then((d) => {
    setRows(d.promotions ?? []);
    setProducts(d.products ?? []);
  }).catch(() => undefined);
  useEffect(() => { void load(); }, []);
  return (
    <>
      <div className="adm-head"><div><h1>할인 이벤트 관리</h1><p>product_promotion 테이블입니다. 남은 값은 여기서 넣으면 됩니다.</p></div></div>
      {err ? <p className="adm-err">{err}</p> : null}
      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 120px 140px 100px", gap: 8 }}>
          <input placeholder="이벤트명" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">대상 상품</option>
            {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
          </select>
          <input placeholder="할인가" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button className="adm-btn primary" type="button" onClick={async () => {
            setErr("");
            const res = await fetch("/api/admin/promotions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ promotion_name: name, product_id: productId ? Number(productId) : null, price_discount: discount ? Number(discount) : null, end_at: end || null }),
            });
            const json = await res.json() as { ok?: boolean; error?: string };
            if (!json.ok) { setErr(json.error || "추가 실패"); return; }
            setName(""); setDiscount("");
            void load();
          }}>추가</button>
        </div>
      </div>
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>ID</th><th>이름</th><th>상품</th><th>할인가</th><th>종료</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.promotion_id}>
                <td>{r.promotion_id}</td>
                <td>{r.promotion_name}</td>
                <td>{products.find((p) => p.product_id === r.product_id)?.product_name ?? r.product_id}</td>
                <td>{r.price_discount ?? "-"}</td>
                <td>{r.end_at ?? "-"}</td>
                <td><button className="adm-btn" type="button" onClick={async () => { await fetch(`/api/admin/promotions?id=${r.promotion_id}`, { method: "DELETE" }); void load(); }}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
