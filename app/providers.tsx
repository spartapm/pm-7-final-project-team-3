"use client";

import { StoreProvider } from "@/lib/store";
import { CloudBanner } from "@/components/CloudBanner";
import { useBenefits } from "@/lib/use-benefits";

function CatalogBoot() {
  useBenefits();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CatalogBoot />
      <CloudBanner />
      {children}
    </StoreProvider>
  );
}
