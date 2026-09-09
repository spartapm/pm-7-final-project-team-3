"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EventForm } from "@/components/EventForm";

function Inner() {
  const q = useSearchParams();
  return <EventForm existing={null} fromResult={q.get("from") === "result"} extractId={q.get("i")} />;
}

export default function EventNew() {
  return <Suspense><Inner /></Suspense>;
}
