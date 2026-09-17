"use client";

import { useEffect, useState } from "react";
import type { CatalogCatKind, CatalogCategory } from "@/lib/catalog-cats";

type Modal = { mode: "add" | "edit"; id?: number; name: string; visible: boolean } | null;

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<CatalogCatKind>("service");
  const [rows, setRows] = useState<CatalogCategory[]>([]);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d: { ok?: boolean; categories?: CatalogCategory[]; error?: string }) => {
        if (!d.ok) {
          setErr(d.error || "카테고리를 불러오지 못했어요.");
          return;
        }
        setRows(d.categories ?? []);
        setErr("");
      })
      .catch(() => setErr("카테고리를 불러오지 못했어요."));
  };

  useEffect(() => { load(); }, []);

  const list = rows.filter((r) => r.kind === tab).sort((a, b) => a.sortOrder - b.sortOrder);

  const saveOrder = async (next: CatalogCategory[]) => {
    setRows((all) => [...all.filter((r) => r.kind !== tab), ...next.map((r, i) => ({ ...r, sortOrder: i }))]);
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: tab, order: next.map((r) => r.id) }),
    });
  };

  const dropOn = (targetId: number) => {
    if (dragId == null || dragId === targetId) return;
    const ids = list.map((r) => r.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = list.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void saveOrder(next);
    setDragId(null);
  };

  const saveModal = async () => {
    if (!modal || busy) return;
    const name = modal.name.trim();
    if (!name) return;
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/categories", {
      method: modal.mode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal.mode === "add"
        ? { kind: tab, name, app_visible: modal.visible }
        : { category_id: modal.id, name, app_visible: modal.visible }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) {
      setErr(json.error || "저장하지 못했어요.");
      return;
    }
    setModal(null);
    load();
  };

  const toggleVisible = async (row: CatalogCategory) => {
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, appVisible: !r.appVisible } : r)));
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: row.id, app_visible: !row.appVisible }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, appVisible: row.appVisible } : r)));
      setErr(json.error || "노출 설정을 바꾸지 못했어요.");
    }
  };

  const remove = async (row: CatalogCategory) => {
    if ((row.linkedCount ?? 0) > 0) {
      setErr("연결된 상품이 있어 삭제할 수 없어요.");
      return;
    }
    if (!window.confirm(`‘${row.name}’ 카테고리를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/categories?id=${row.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setErr(json.error || "삭제하지 못했어요.");
      return;
    }
    load();
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>카테고리 관리</h1>
          <p>서비스 분류와 앱 혜택 필터에 쓰이는 카테고리를 관리합니다.</p>
        </div>
        <button className="adm-btn primary" type="button" onClick={() => setModal({ mode: "add", name: "", visible: true })}>
          카테고리 추가
        </button>
      </div>
      <div className="adm-tabs">
        <button className={tab === "service" ? "on" : ""} type="button" onClick={() => setTab("service")}>서비스 카테고리</button>
        <button className={tab === "benefit" ? "on" : ""} type="button" onClick={() => setTab("benefit")}>혜택 카테고리</button>
      </div>
      {err ? <p className="adm-err">{err}</p> : null}
      <div className="adm-card" style={{ padding: 0 }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>순서</th>
              <th>카테고리명</th>
              <th style={{ width: 120 }}>연결된 상품 수</th>
              {tab === "benefit" ? <th style={{ width: 100 }}>앱 노출</th> : null}
              <th style={{ width: 140 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={tab === "benefit" ? 5 : 4} style={{ color: "#667085" }}>등록된 카테고리가 없어요.</td></tr>
            ) : list.map((row, i) => (
              <tr
                key={row.id}
                draggable
                onDragStart={() => setDragId(row.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropOn(row.id)}
                className={dragId === row.id ? "adm-cat-drag" : ""}
              >
                <td>
                  <span className="adm-cat-handle" title="드래그해서 순서 변경">⋮⋮ {i + 1}</span>
                </td>
                <td><b>{row.name}</b></td>
                <td>{row.linkedCount ?? 0}</td>
                {tab === "benefit" ? (
                  <td>
                    <button
                      className={`adm-switch ${row.appVisible ? "on" : ""}`}
                      type="button"
                      aria-label="앱 노출"
                      onClick={() => void toggleVisible(row)}
                    >
                      <i />
                    </button>
                  </td>
                ) : null}
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn ghost" type="button" onClick={() => setModal({ mode: "edit", id: row.id, name: row.name, visible: row.appVisible })}>수정</button>
                    <button className="adm-btn ghost" type="button" disabled={(row.linkedCount ?? 0) > 0} onClick={() => void remove(row)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal ? (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.mode === "add" ? "카테고리 추가" : "카테고리 수정"}</h2>
            <div className="adm-field" style={{ textAlign: "left" }}>
              <label>카테고리명 <i>*</i></label>
              <input value={modal.name} maxLength={30} placeholder="카테고리명을 입력하세요" onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            </div>
            {tab === "benefit" ? (
              <label className="adm-check">
                <input type="checkbox" checked={modal.visible} onChange={(e) => setModal({ ...modal, visible: e.target.checked })} />
                앱 노출 — 앱의 혜택 화면 필터에 이 카테고리를 보여줍니다
              </label>
            ) : null}
            <div className="adm-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="adm-btn ghost" type="button" onClick={() => setModal(null)}>취소</button>
              <button className="adm-btn primary" type="button" disabled={busy || !modal.name.trim()} onClick={() => void saveModal()}>저장</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
