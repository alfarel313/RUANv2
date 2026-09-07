"use client";

import { createContext, useContext } from "react";
import type { UsePresenceResult } from "@/hooks/usePresence";

export const PresenceContext = createContext<UsePresenceResult | null>(null);

export function usePresenceCtx(): UsePresenceResult {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresenceCtx: PresenceContext belum ada");
  return ctx;
}
