"use client";

import { StoreProvider } from "@/lib/store";
import { CloudBanner } from "@/components/CloudBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CloudBanner />
      {children}
    </StoreProvider>
  );
}
