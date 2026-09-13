"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ReportData } from "@/lib/types";

export type ReportWithId = ReportData & { id: string };

/**
 * Langganan laporan kota Bekasi untuk admin (semua status, sort terbaru dulu).
 * Dibalik komponen AdminShell — pastikan isAdmin sebelum pakai hasilnya.
 * Live via onSnapshot; error-callback → list kosong (anti gagal demo).
 */
export function useAdminReports(isAdmin: boolean) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithId[] | null>(null);

  useEffect(() => {
    if (!isAdmin || !user) return;
    const q = query(collection(db, "reports"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ReportWithId[] = [];
        snap.forEach((d) => {
          const r = d.data() as ReportData;
          if (r.city === "Bekasi") list.push({ ...r, id: d.id });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setReports(list);
      },
      () => setReports([])
    );
    return unsub;
  }, [isAdmin, user]);

  return reports;
}
