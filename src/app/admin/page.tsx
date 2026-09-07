"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ReportData } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import Link from "next/link";

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);

  const isAdmin = userData?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    // admin melihat semua status (pending + verified + rejected) per kota Bekasi
    const q = query(collection(db, "reports"));
    const unsub = onSnapshot(q, (snap) => {
      const list: ReportData[] = [];
      snap.forEach((d) => {
        const r = d.data() as ReportData;
        if (r.city === "Bekasi") list.push({ ...r, id: d.id } as ReportData);
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setReports(list);
    });
    return unsub;
  }, [isAdmin]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center text-sm font-semibold text-slate-500">
        Memuat…
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          🛠️ Panel Admin
        </h1>
        <div className="mt-4 rounded-2xl border-2 border-amber bg-white p-6 text-center shadow">
          <p className="text-sm font-semibold text-slate-700">
            Halaman ini khusus admin Kota Bekasi. Masuk dengan akun admin
            (alfarel3134@gmail.com) untuk memverifikasi laporan warga.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[48px] items-center rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            ← Kembali ke Peta
          </Link>
        </div>
      </main>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");
  const reviewed = reports.filter((r) => r.status !== "pending");

  const review = async (id: string, status: "verified" | "rejected") => {
    await updateDoc(doc(db, "reports", id), {
      status,
      verifiedBy: user.uid,
      verifiedAt: Date.now(),
    });
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">
        🛠️ Panel Admin — Kota Bekasi
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Verifikasi laporan warga. Laporan terverifikasi otomatis tampil di
        peta dan feed Info Bahaya.
      </p>

      <section aria-label="Menunggu verifikasi" className="mt-5">
        <h2 className="text-base font-extrabold text-amber">
          ⏳ Menunggu Verifikasi ({pending.length})
        </h2>
        <div className="mt-2 space-y-3">
          {pending.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Tidak ada laporan menunggu.
            </p>
          )}
          {pending.map((r) => (
            <div key={r.title}>
              <ReportCard report={r} showStatus />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => review((r as ReportData & { id: string }).id, "verified")}
                  className="min-h-[48px] flex-1 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
                >
                  ✅ Verifikasi
                </button>
                <button
                  onClick={() => review((r as ReportData & { id: string }).id, "rejected")}
                  className="min-h-[48px] flex-1 rounded-xl border-2 border-sos text-sm font-bold text-sos hover:bg-sos/5"
                >
                  ❌ Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Sudah ditinjau" className="mt-8">
        <h2 className="text-base font-extrabold text-slate-700">
          Riwayat ({reviewed.length})
        </h2>
        <div className="mt-2 space-y-3">
          {reviewed.map((r, i) => (
            <ReportCard key={i} report={r} showStatus />
          ))}
        </div>
      </section>
    </main>
  );
}
