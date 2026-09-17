"use client";

import type { SyntheticEvent } from "react";
import { isImageIcon } from "@/lib/bundle-icon";
import type { Benefit } from "@/lib/types";

function safeIcon(raw?: string | null) {
  const v = String(raw ?? "").trim();
  return isImageIcon(v) && v.length < 180_000 ? v : "";
}

function fallback(e: SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.fb) return;
  el.dataset.fb = "1";
  el.src = "/brand/logo-mark.png";
}

export function BenefitIcons({ b, className = "benefit-ico" }: { b?: Benefit | null; className?: string }) {
  if (!b) return null;
  const a = safeIcon(b.parentIcon) || safeIcon(b.providerLogo);
  const c = safeIcon(b.perkIcon);
  const one = a || c || safeIcon(b.icon) || "/brand/logo-mark.png";
  if (a && c && a !== c) {
    return (
      <span className={`${className} pair`} aria-hidden>
        <img className="a" src={a} alt="" onError={fallback} />
        <img className="b" src={c} alt="" onError={fallback} />
      </span>
    );
  }
  return (
    <span className={className} aria-hidden>
      <img src={one} alt="" onError={fallback} />
    </span>
  );
}
