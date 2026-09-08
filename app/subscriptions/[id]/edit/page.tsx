"use client";

import { use } from "react";
import { SubForm } from "@/components/SubForm";

export default function SubEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SubForm existingId={id === "new" ? null : id} />;
}
