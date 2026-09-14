"use client";

import { StoreProvider } from "@/lib/store";
import { CloudBanner } from "@/components/CloudBanner";
import { CatalogProvider } from "@/lib/use-benefits";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CatalogProvider>
        <CloudBanner />
        {children}
      </CatalogProvider>
    </StoreProvider>
  );
}
