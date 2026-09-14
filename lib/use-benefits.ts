"use client";

import { useCallback, useEffect, useState } from "react";
import { findBrand } from "@/lib/brands";
import { BENEFITS, categoryFromAdmin, type ServiceHit } from "@/lib/catalog";
import type { BundleProduct } from "@/lib/bundles";
import type { ProductRow } from "@/lib/catalog-db";
import type { Benefit } from "@/lib/types";

function soloHitsOf(rows: ProductRow[]): ServiceHit[] {
  return rows
    .filter((p) => (p.product_type || "단독") !== "결합" && p.is_active !== false)
    .map((p) => {
      const brand = findBrand(p.product_name);
      return {
        id: `p-${p.product_id}`,
        name: p.product_name,
        category: categoryFromAdmin(p.category) || brand?.category || "other",
        amount: Number(p.price_standard) || brand?.amount || 0,
        color: p.provider?.brand_color || brand?.color || "#2576f2",
        logo: "",
      };
    });
}

export function useBenefits() {
  const [items, setItems] = useState<Benefit[]>(BENEFITS);
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [soloProducts, setSoloProducts] = useState<ServiceHit[]>([]);
  const [source, setSource] = useState<"code" | "db">("code");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setLoaded(false);
    setError(false);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d: { benefits?: Benefit[]; bundleProducts?: BundleProduct[]; products?: ProductRow[]; source?: "code" | "db" }) => {
        if (!live) return;
        if (d.benefits?.length) setItems(d.benefits);
        setBundles(d.bundleProducts ?? []);
        setSoloProducts(soloHitsOf(d.products ?? []));
        if (d.source === "db") setSource("db");
        setLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        setError(true);
        setLoaded(true);
      });
    return () => { live = false; };
  }, [nonce]);
  return { benefits: items, bundles, soloProducts, source, loaded, error, reload };
}
