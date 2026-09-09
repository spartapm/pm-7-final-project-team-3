"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SubForm } from "@/components/SubForm";

function Inner() {
  const q = useSearchParams();
  return <SubForm existingId={null} check fromResult={q.get("from") === "result"} extractId={q.get("i")} />;
}

export default function AddConfirm() {
  return <Suspense><Inner /></Suspense>;
}
