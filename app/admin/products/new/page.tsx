"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BundleItemRow, BundleRow, ProductRow, ProviderRow } from "@/lib/catalog-db";

const CATS = ["통신사 결합", "커머스 멤버십", "카드 혜택", "OTT", "음악", "기타"];

function Inner() {
  const router = useRouter();
  const q = useSearchParams();
  const editSolo = q.get("solo");
  const editBundle = q.get("bundle");
  const [mode, setMode] = useState<"bundle" | "solo">(editSolo ? "solo" : "bundle");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("커머스 멤버십");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState("");
  const [apply, setApply] = useState("");
  const [req, setReq] = useState("");
  const [expires, setExpires] = useState("");
  const [picked, setPicked] = useState<{ product_id: number; item_role: "PRIMARY" | "BENEFIT" }[]>([]);
  const [addId, setAddId] = useState("");
  const [active, setActive] = useState(true);
  const [bundleId, setBundleId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/session").then((r) => r.json()).then((d: { providers: ProviderRow[]; products: ProductRow[]; bundles: BundleRow[]; items: BundleItemRow[] }) => {
      setProviders(d.providers ?? []);
      setProducts(d.products ?? []);
      if (editBundle) {
        const b = (d.bundles ?? []).find((x) => String(x.bundle_id) === editBundle);
        if (!b) return;
        setMode("bundle");
        setBundleId(b.bundle_id);
        setName(b.bundle_name);
        setCategory(b.category || "커머스 멤버십");
        setTitle(b.card_title);
        setBody(b.card_body);
        setIcon(b.icon);
        setPrice(String(b.price_bundled || ""));
        setApply(b.apply_method);
        setReq(b.requirement);
        setUrl(b.official_url);
        setExpires(b.expires ? b.expires.slice(0, 10) : "");
        setActive(b.is_active);
        setPicked((d.items ?? []).filter((i) => String(i.bundle_id) === editBundle).map((i) => ({
          product_id: i.product_id,
          item_role: i.item_role === "BENEFIT" ? "BENEFIT" : "PRIMARY",
        })));
      }
      if (editSolo) {
        const p = (d.products ?? []).find((x) => String(x.product_id) === editSolo);
        if (!p) return;
        setMode("solo");
        setProductId(p.product_id);
        setName(p.product_name);
        setProviderId(p.provider_id ? String(p.provider_id) : "");
        setCategory(p.category);
        setPrice(String(p.price_standard || ""));
        setUrl(p.official_url);
        setActive(p.is_active);
      }
    }).catch(() => undefined);
  }, [editBundle, editSolo]);

  const sum = picked.reduce((a, i) => a + (products.find((p) => p.product_id === i.product_id)?.price_standard ?? 0), 0);
  const bundled = Number(String(price).replace(/[^\d]/g, "")) || 0;
  const saveAmt = Math.max(0, sum - bundled);
  const unused = products.filter((p) => !picked.some((x) => x.product_id === p.product_id));

  const save = async (publish: boolean) => {
    setBusy(true);
    setErr("");
    try {
      if (mode === "solo") {
        const payload = {
          product_id: productId,
          provider_id: providerId ? Number(providerId) : null,
          product_name: name,
          category,
          product_type: "단독",
          price_standard: bundled,
          official_url: url,
          is_active: publish,
        };
        const res = await fetch("/api/admin/products", {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        if (!json.ok) throw new Error(json.error || "저장 실패");
      } else {
        const payload = {
          bundle_id: bundleId,
          bundle_name: name,
          category,
          card_title: title,
          card_body: body,
          icon,
          price_bundled: bundled,
          apply_method: apply,
          requirement: req,
          official_url: url,
          expires: expires || null,
          is_active: publish,
          items: picked,
        };
        const res = await fetch("/api/admin/bundles", {
          method: bundleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        if (!json.ok) throw new Error(json.error || "저장 실패");
      }
      router.push("/admin/products");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const providerName = (id: number) => {
    const p = products.find((x) => x.product_id === id);
    const prov = providers.find((x) => x.provider_id === p?.provider_id);
    return prov?.provider_name ?? "";
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>상품 등록</h1>
          <p>단독상품 또는 결합상품을 등록하여 혜택을 제공합니다.</p>
        </div>
        <div className="adm-actions">
          <button className="adm-btn ghost" type="button" disabled={busy} onClick={() => void save(false)}>임시저장</button>
          <button className="adm-btn primary" type="button" disabled={busy} onClick={() => void save(true)}>등록하기</button>
        </div>
      </div>
      {err ? <p className="adm-err">{err}</p> : null}
      <div className="adm-tabs">
        <button className={mode === "bundle" ? "on" : ""} type="button" onClick={() => setMode("bundle")}>결합상품</button>
        <button className={mode === "solo" ? "on" : ""} type="button" onClick={() => setMode("solo")}>단독상품</button>
      </div>
      <div className="adm-grid2">
        <div className="adm-card">
          <div className="adm-field">
            <label>상품 유형 <i>*</i></label>
            <div className="adm-radio">
              <label><input type="radio" checked={mode === "solo"} onChange={() => setMode("solo")} /> 단독상품</label>
              <label><input type="radio" checked={mode === "bundle"} onChange={() => setMode("bundle")} /> 결합상품</label>
            </div>
          </div>
          <div className="adm-field">
            <label>상품명 <i>*</i></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="네이버멤버십 & Spotify" />
          </div>
          {mode === "solo" ? (
            <div className="adm-field">
              <label>제공사 <i>*</i></label>
              <select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                <option value="">제공사를 선택해주세요</option>
                {providers.map((p) => <option key={p.provider_id} value={p.provider_id}>{p.provider_name} ({p.provider_type || "기타"})</option>)}
              </select>
            </div>
          ) : null}
          <div className="adm-field">
            <label>카테고리 <i>*</i></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {mode === "bundle" ? (
            <div className="adm-field">
              <label>구성 상품 <i>*</i></label>
              <p style={{ margin: 0, fontSize: 12, color: "#667085" }}>결합상품에 포함할 상품을 선택해주세요.</p>
              {picked.map((row, idx) => {
                const p = products.find((x) => x.product_id === row.product_id);
                return (
                  <div key={row.product_id} className="adm-item">
                    <div>
                      <b>{p?.product_name}</b>
                      <div style={{ fontSize: 12, color: "#667085" }}>{providerName(row.product_id)} · {(p?.price_standard ?? 0).toLocaleString("ko-KR")}원</div>
                    </div>
                    <span className="role">{row.item_role === "PRIMARY" ? "주상품 (PRIMARY)" : "부가 상품 (BENEFIT)"}</span>
                    <button className="adm-btn" type="button" onClick={() => setPicked((xs) => xs.filter((_, i) => i !== idx))}>×</button>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 8 }}>
                <select value={addId} onChange={(e) => setAddId(e.target.value)} style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid #d7e0ee" }}>
                  <option value="">기존 상품 추가</option>
                  {unused.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                </select>
                <button className="adm-btn" type="button" onClick={() => {
                  if (!addId) return;
                  setPicked((xs) => [...xs, { product_id: Number(addId), item_role: xs.length ? "BENEFIT" : "PRIMARY" }]);
                  setAddId("");
                }}>+ 추가</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="adm-card">
          <div className="adm-field">
            <label>{mode === "bundle" ? "결합 가격" : "정가"} <i>*</i></label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4,900" />
              <span>원</span>
            </div>
          </div>
          {mode === "bundle" ? (
            <div className="adm-sum" style={{ marginBottom: 14 }}>
              <div>정상 합계 <span className="right">{sum.toLocaleString("ko-KR")}원</span></div>
              <div style={{ color: "#667085", fontSize: 12, clear: "both" }}>
                ({picked.map((i) => {
                  const p = products.find((x) => x.product_id === i.product_id);
                  return p ? `${p.product_name} ${(p.price_standard ?? 0).toLocaleString("ko-KR")}원` : "";
                }).filter(Boolean).join(" + ") || "구성 상품 없음"})
              </div>
              <div>사용자 절약액 <b className="good">-{saveAmt.toLocaleString("ko-KR")}원</b></div>
            </div>
          ) : null}
          {mode === "bundle" ? (
            <>
              <div className="adm-field">
                <label>카드 제목 <i>*</i></label>
                <input value={title} maxLength={30} onChange={(e) => setTitle(e.target.value)} placeholder="결합하면 Spotify가 무료!" />
                <span style={{ fontSize: 11, color: "#98a2b3", textAlign: "right" }}>{title.length}/30</span>
              </div>
              <div className="adm-field">
                <label>카드 설명 <i>*</i></label>
                <textarea value={body} maxLength={200} onChange={(e) => setBody(e.target.value)} />
                <span style={{ fontSize: 11, color: "#98a2b3", textAlign: "right" }}>{body.length}/200</span>
              </div>
              <div className="adm-field">
                <label>아이콘</label>
                <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎵" />
              </div>
              <div className="adm-field">
                <label>적용 방법 <i>*</i></label>
                <textarea value={apply} onChange={(e) => setApply(e.target.value)} placeholder={"1. ...\n2. ..."} />
              </div>
              <div className="adm-field">
                <label>유의사항</label>
                <textarea value={req} onChange={(e) => setReq(e.target.value)} />
              </div>
              <div className="adm-field">
                <label>만료일</label>
                <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
              </div>
            </>
          ) : null}
          <div className="adm-field">
            <label>공식 URL {mode === "bundle" ? <i>*</i> : null}</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminProductNewPage() {
  return <Suspense><Inner /></Suspense>;
}
