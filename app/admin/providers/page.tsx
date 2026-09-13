"use client";

import { useEffect, useState } from "react";
import type { ProviderRow } from "@/lib/catalog-db";

export default function AdminProvidersPage() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("통신사");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#2576f2");
  const [err, setErr] = useState("");
  const load = () => fetch("/api/admin/providers").then((r) => r.json()).then((d) => setRows(d.rows ?? [])).catch(() => undefined);
  useEffect(() => { void load(); }, []);
  return (
    <>
      <div className="adm-head"><div><h1>제공사 관리</h1><p>결합·단독 상품의 드롭다운에 쓰입니다.</p></div></div>
      {err ? <p className="adm-err">{err}</p> : null}
      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr 1.4fr 120px 100px", gap: 8 }}>
          <input placeholder="제공사명" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="유형" value={type} onChange={(e) => setType(e.target.value)} />
          <input placeholder="공식 URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <input value={color} onChange={(e) => setColor(e.target.value)} />
          <button className="adm-btn primary" type="button" onClick={async () => {
            setErr("");
            const res = await fetch("/api/admin/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider_name: name, provider_type: type, official_url: url, brand_color: color }) });
            const json = await res.json() as { ok?: boolean; error?: string };
            if (!json.ok) { setErr(json.error || "추가 실패"); return; }
            setName(""); setUrl("");
            void load();
          }}>추가</button>
        </div>
      </div>
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>ID</th><th>이름</th><th>유형</th><th>URL</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.provider_id}>
                <td>{p.provider_id}</td>
                <td>{p.provider_name}</td>
                <td>{p.provider_type}</td>
                <td>{p.official_url}</td>
                <td><button className="adm-btn" type="button" onClick={async () => { await fetch(`/api/admin/providers?id=${p.provider_id}`, { method: "DELETE" }); void load(); }}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
