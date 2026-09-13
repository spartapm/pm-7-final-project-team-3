"use client";

import { useEffect, useState } from "react";
import { BENEFITS } from "@/lib/catalog";
import type { BundleProduct } from "@/lib/bundles";
import type { Benefit } from "@/lib/types";

export function useBenefits() {
  const [items, setItems] = useState<Benefit[]>(BENEFITS);
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [source, setSource] = useState<"code" | "db">("code");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d: { benefits?: Benefit[]; bundleProducts?: BundleProduct[]; source?: "code" | "db" }) => {
        if (!live) return;
        if (d.benefits?.length) setItems(d.benefits);
        setBundles(d.bundleProducts ?? []);
        if (d.source === "db") setSource("db");
        setLoaded(true);
      })
      .catch(() => {
        if (live) setLoaded(true);
      });
    return () => { live = false; };
  }, []);
  return { benefits: items, bundles, source, loaded };
}
