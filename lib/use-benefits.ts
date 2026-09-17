"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { findBrand } from "@/lib/brands";
import { categoryFromAdmin, type ServiceHit } from "@/lib/catalog";
import type { BundleProduct } from "@/lib/bundles";
import type { ProductRow, ProviderRow } from "@/lib/catalog-db";
import { setCatalogIcons } from "@/lib/catalog-icons";
import { DEFAULT_BENEFIT_FILTERS } from "@/lib/catalog-cats";
import type { Benefit } from "@/lib/types";

function soloHitsOf(rows: ProductRow[]): ServiceHit[] {
  return rows
    .filter((p) => (p.product_type || "단독") !== "결합" && p.is_active !== false)
    .map((p) => {
      const brand = findBrand(p.product_name);
      const logo = p.icon || p.provider?.logo_url || "";
      const plans = (p.plans ?? []).map((x) => ({ name: x.plan_name, amount: Number(x.price_standard) || 0 }));
      return {
        id: `p-${p.product_id}`,
        name: p.product_name,
        nameEn: p.product_name_en || "",
        adminCategory: p.category || "",
        plans,
        category: categoryFromAdmin(p.category) || brand?.category || "other",
        amount: Number(plans[0]?.amount || p.price_standard) || 0,
        color: p.provider?.brand_color || brand?.color || "#2576f2",
        logo,
      };
    });
}

type CatalogState = {
  benefits: Benefit[];
  bundles: BundleProduct[];
  soloProducts: ServiceHit[];
  providers: { id: string; name: string }[];
  benefitFilters: string[];
  source: "code" | "db";
  loaded: boolean;
  error: boolean;
  reload: () => void;
};

const CatalogCtx = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Benefit[]>([]);
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [soloProducts, setSoloProducts] = useState<ServiceHit[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [source, setSource] = useState<"code" | "db">("code");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<string[]>([...DEFAULT_BENEFIT_FILTERS]);
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
      .then((d: { benefits?: Benefit[]; bundleProducts?: BundleProduct[]; products?: ProductRow[]; providers?: ProviderRow[]; source?: "code" | "db"; benefitFilters?: string[] }) => {
        if (!live) return;
        setItems(d.benefits ?? []);
        setBundles(d.bundleProducts ?? []);
        setSoloProducts(soloHitsOf(d.products ?? []));
        setProviders((d.providers ?? []).map((p) => ({ id: String(p.provider_id), name: p.provider_name })));
        const nextFilters = (d.benefitFilters ?? []).filter(Boolean);
        setFilters(nextFilters.length ? nextFilters : [...DEFAULT_BENEFIT_FILTERS]);
        setCatalogIcons([
          ...(d.products ?? []).flatMap((p) => [
            { name: p.product_name, icon: p.icon || p.provider?.logo_url },
            { name: p.product_name_en, icon: p.icon || p.provider?.logo_url },
          ]),
          ...(d.providers ?? []).map((p) => ({ name: p.provider_name, icon: p.logo_url })),
        ]);
        if (d.source === "db") setSource("db");
        setLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        setItems([]);
        setError(true);
        setLoaded(true);
      });
    return () => { live = false; };
  }, [nonce]);

  const value = useMemo(
    () => ({ benefits: items, bundles, soloProducts, providers, benefitFilters: filters, source, loaded, error, reload }),
    [items, bundles, soloProducts, providers, filters, source, loaded, error, reload],
  );
  return createElement(CatalogCtx.Provider, { value }, children);
}

export function useBenefits() {
  const ctx = useContext(CatalogCtx);
  return ctx ?? {
    benefits: [],
    bundles: [],
    soloProducts: [],
    providers: [],
    benefitFilters: [...DEFAULT_BENEFIT_FILTERS],
    source: "code" as const,
    loaded: false,
    error: false,
    reload: () => undefined,
  };
}
