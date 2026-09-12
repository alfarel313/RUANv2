"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ReportData } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import { SkeletonList } from "@/components/Skeleton";
import { loginGoogle } from "@/lib/firebase";

export default function BahayaPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<ReportData[] | null>(null);

  useEffect(() => {
    if (!user) return;
    // tanpa composite index: filter client-side (aman untuk skala demo)
    const q = query(
      collection(db, "reports"),
      where("status", "==", "verified")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ReportData[] = [];
        snap.forEach((d) => {
          const r = d.data() as ReportData;
          if (r.city === "Bekasi") list.push(r);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setReports(list);
      },
      () => setReports([])
    );
    return unsub;
  }, [user]);

  if (!user && !loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          ⚠️ Info Bahaya Terbaru
        </h1>
        <button
          onClick={() => loginGoogle()}
          className="mt-4 min-h-[56px] w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark"
        >
          🔐 Masuk untuk melihat info bahaya terverifikasi
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">
        ⚠️ Info Bahaya Terbaru
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Semua info di bawah ini sudah <strong>diverifikasi admin</strong>{" "}
        Kota Bekasi — dapat dipercaya, terbaru dulu.
      </p>

      <h2 className="sr-only">Daftar laporan terverifikasi</h2>
      <div className="mt-4 space-y-3">
        {reports === null && (
          <SkeletonList label="Memuat info bahaya" count={4} />
        )}
        {reports?.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl" aria-hidden="true">
              🎉
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Tidak ada bahaya terverifikasi saat ini. Kota Bekasi aman
              terpantau.
            </p>
          </div>
        )}
        {reports?.map((r, i) => (
          <ReportCard key={i} report={r} showStatus />
        ))}
      </div>
    </main>
  );
}
