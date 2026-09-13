"use client";

import { useState } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { validateSourceURL } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import Modal from "@/components/Modal";
import AdminShell from "@/components/AdminShell";
import { useAdminReports } from "@/hooks/useAdminReports";
import dynamicImport from "next/dynamic";
import {
  Clock3,
  Newspaper,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

// Peta (leaflet) WAJIB client-only â€” ssr:false seperti LocationPicker (lapor)
const LocationView = dynamicImport(() => import("@/components/LocationView"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[200px] rounded-xl border-2 border-slate-200 bg-slate-100"
      role="status"
      aria-label="Memuat peta lokasi kejadian"
    >
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  ),
});

export default function AdminVerifyPage() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === "admin";
  const reports = useAdminReports(isAdmin);

  // Modal verifikasi 2-langkah: link berita opsional â†’ simpan sourceURL + status
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [sourceURL, setSourceURL] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pending = (reports ?? []).filter((r) => r.status === "pending");

  const verifyingReport = pending.find((r) => r.id === verifyId);

  const openVerify = (id: string) => {
    setVerifyId(id);
    setSourceURL("");
    setLinkError(null);
  };

  const review = async (id: string, status: "verified" | "rejected") => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "reports", id), {
        status,
        verifiedBy: user.uid,
        verifiedAt: Date.now(),
      });
    } catch (err) {
      // verifikasi gagal (offline/permission) â€” jangan rejection bocor
      console.error("Gagal memverifikasi laporan:", err);
    }
  };

  const confirmVerify = async () => {
    if (!verifyId || !user) return;
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
    } catch {
      setLinkError("Gagal menyimpan â€” periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      description="Periksa titik lokasi kejadian, verifikasi laporan warga, atau kelola lewat tab Riwayat dan Tempat Aman."
    >
      {isAdmin && (
        <>
          <section aria-label="Menunggu verifikasi">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-amber">
              <Clock3 aria-hidden="true" className="h-5 w-5" /> Menunggu
              Verifikasi ({pending.length})
            </h2>
            <div className="mt-2 space-y-3">
              {pending.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Tidak ada laporan menunggu.
                </p>
              )}
              {pending.map((r) => (
                <div key={r.id}>
                  <ReportCard report={r} showStatus />
                  {/* Titik lokasi kejadian â€” admin memeriksa sebelum verifikasi/tolak */}
                  <div className="mt-2">
                    <LocationView
                      value={{ lat: r.lat, lng: r.lng }}
                      label="Lokasi kejadian"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openVerify(r.id)}
                      className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
                    >
                      <ShieldCheck aria-hidden="true" className="h-4 w-4" />{" "}
                      Verifikasi
                    </button>
                    <button
                      onClick={() => review(r.id, "rejected")}
                      className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-sos text-sm font-bold text-sos hover:bg-sos/5"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" /> Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Modal verifikasi 2-langkah â€” link berita opsional */}
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
                {/* Titik lokasi kejadian di peta â€” admin memeriksa sebelum memutuskan */}
                <div className="mt-3">
                  <LocationView
                    value={{ lat: verifyingReport.lat, lng: verifyingReport.lng }}
                    label="Lokasi kejadian"
                  />
                </div>
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
                  placeholder="https://www.detik.com/â€¦"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
                />
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Newspaper aria-hidden="true" className="h-3 w-3" />
                  Warga akan melihat sumber sebagai &quot;nama-domain&quot;
                  yang bisa diklik. Wajib https:// bila diisi.
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
                    {busy ? "Menyimpanâ€¦" : "Verifikasi"}
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
        </>
      )}
    </AdminShell>
  );
}
