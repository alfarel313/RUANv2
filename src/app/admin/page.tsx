"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ReportData } from "@/lib/types";
import { validateSourceURL } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import PlaceAdminSection from "@/components/PlaceAdminSection";
import Modal from "@/components/Modal";
import { SkeletonList } from "@/components/Skeleton";
import Link from "next/link";
import {
  ChevronLeft,
  Clock3,
  Newspaper,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);

  // Modal verifikasi 2-langkah: link berita opsional → simpan sourceURL + status
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [sourceURL, setSourceURL] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Wrench aria-hidden="true" className="h-7 w-7" /> Panel Admin
        </h1>
        <div className="mt-4">
          <SkeletonList label="Memuat panel admin" count={3} />
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Wrench aria-hidden="true" className="h-7 w-7" /> Panel Admin
        </h1>
        <div className="mt-4 rounded-2xl border-2 border-amber bg-white p-6 text-center shadow">
          <p className="text-sm font-semibold text-slate-700">
            Halaman ini khusus admin Kota Bekasi. Masuk dengan akun admin
            (alfarel3134@gmail.com) untuk memverifikasi laporan warga.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Kembali ke
            Peta
          </Link>
        </div>
      </main>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");
  const reviewed = reports.filter((r) => r.status !== "pending");

  const openVerify = (id: string) => {
    setVerifyId(id);
    setSourceURL("");
    setLinkError(null);
  };

  const review = async (id: string, status: "verified" | "rejected") => {
    try {
      await updateDoc(doc(db, "reports", id), {
        status,
        verifiedBy: user.uid,
        verifiedAt: Date.now(),
      });
    } catch (err) {
      // verifikasi gagal (offline/permission) — jangan rejection bocor
      console.error("Gagal memverifikasi laporan:", err);
    }
  };

  const confirmVerify = async () => {
    if (!verifyId) return;
    const err = validateSourceURL(sourceURL);
    if (err) {
      setLinkError(err);
      return;
    }
    setBusy(true);
    try {
      await updateDoc(doc(db, "reports", verifyId), {
        status: "verified",
        verifiedBy: user.uid,
        verifiedAt: Date.now(),
        sourceURL: sourceURL.trim() ? sourceURL.trim() : null,
      });
      setVerifyId(null);
    } catch (err) {
      console.error("Gagal memverifikasi laporan:", err);
      setLinkError("Gagal menyimpan — periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const verifyingReport = pending.find(
    (r) => (r as ReportData & { id: string }).id === verifyId
  );

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Wrench aria-hidden="true" className="h-7 w-7" /> Panel Admin — Kota
        Bekasi
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Verifikasi laporan warga. Laporan terverifikasi otomatis tampil di
        peta dan feed Info Bahaya.
      </p>

      <section aria-label="Menunggu verifikasi" className="mt-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-amber">
          <Clock3 aria-hidden="true" className="h-5 w-5" /> Menunggu Verifikasi
          ({pending.length})
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
                  onClick={() => openVerify((r as ReportData & { id: string }).id)}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
                >
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Verifikasi
                </button>
                <button
                  onClick={() => review((r as ReportData & { id: string }).id, "rejected")}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-sos text-sm font-bold text-sos hover:bg-sos/5"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" /> Tolak
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

      <PlaceAdminSection />

      {/* Modal verifikasi 2-langkah — link berita opsional */}
      {verifyId && verifyingReport && (
        <Modal
          label="Verifikasi laporan"
          onClose={() => {
            if (!busy) setVerifyId(null);
          }}
        >
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <ShieldCheck aria-hidden="true" className="h-6 w-6 text-brand" />{" "}
              Verifikasi Laporan
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-600">
              {verifyingReport.title}
            </p>
            <label
              htmlFor="source-url"
              className="mt-4 block text-xs font-bold text-slate-700"
            >
              Link berita pendukung (opsional)
            </label>
            <input
              id="source-url"
              type="url"
              value={sourceURL}
              onChange={(e) => {
                setSourceURL(e.target.value);
                setLinkError(null);
              }}
              maxLength={300}
              placeholder="https://www.detik.com/…"
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Newspaper aria-hidden="true" className="h-3 w-3" />
              Warga akan melihat sumber sebagai &quot;nama-domain&quot; yang
              bisa diklik. Wajib https:// bila diisi.
            </p>
            {linkError && (
              <p role="alert" className="mt-1 text-sm font-bold text-sos">
                {linkError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={confirmVerify}
                disabled={busy}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                {busy ? "Menyimpan…" : "Verifikasi"}
              </button>
              <button
                onClick={() => setVerifyId(null)}
                disabled={busy}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                <X aria-hidden="true" className="h-4 w-4" /> Batal
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
