"use client";

import { useState } from "react";
import { deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { validateSourceURL } from "@/lib/types";
import type { ReportStatus, ReportType } from "@/lib/types";
import ReportCard, { TYPE_LABELS } from "@/components/ReportCard";
import Modal from "@/components/Modal";
import AdminShell from "@/components/AdminShell";
import { useAdminReports } from "@/hooks/useAdminReports";
import {
  Newspaper,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

/** Urutan jenis kejadian untuk filter — satu sumber tipe dari lib/types */
const TYPE_KEYS: ReportType[] = [
  "banjir",
  "kebakaran",
  "kejahatan",
  "jalan_rusak",
  "kehilangan",
  "lainnya",
];

const STATUS_LABELS: Record<ReportStatus, string> = {
  verified: "Terverifikasi",
  rejected: "Ditolak",
  pending: "Menunggu",
};

/** Status yang ditampilkan halaman ini (riwayat = sudah ditinjau) */
const STATUS_KEYS: ReportStatus[] = ["verified", "rejected"];

export default function AdminRiwayatPage() {
  const { userData } = useAuth();
  const isAdmin = userData?.role === "admin";
  const reports = useAdminReports(isAdmin);

  // Filter tampilan — murni klien, tak mengubah data
  const [typeFilter, setTypeFilter] = useState<ReportType | "semua">("semua");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "semua">(
    "semua"
  );

  // Edit & hapus laporan yang sudah ditinjau (verified/rejected)
  const [editId, setEditId] = useState<string | null>(null);
  const [editURL, setEditURL] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reviewed = (reports ?? []).filter((r) => r.status !== "pending");
  const visible = reviewed.filter(
    (r) =>
      (typeFilter === "semua" || r.type === typeFilter) &&
      (statusFilter === "semua" || r.status === statusFilter)
  );

  const editingReport = reviewed.find((r) => r.id === editId);
  const deletingReport = reviewed.find((r) => r.id === deleteId);

  const openEdit = (r: { id: string; sourceURL?: string | null }) => {
    setEditId(r.id);
    setEditURL(r.sourceURL ?? "");
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const err = validateSourceURL(editURL);
    if (err) {
      setEditError(err);
      return;
    }
    setEditBusy(true);
    try {
      await updateDoc(doc(db, "reports", editId), {
        sourceURL: editURL.trim() ? editURL.trim() : null,
      });
      setEditId(null);
    } catch {
      setEditError("Gagal menyimpan — periksa koneksi lalu coba lagi.");
    } finally {
      setEditBusy(false);
    }
  };

  const removeReport = async () => {
    if (!deleteId) return;
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(db, "reports", deleteId));
      setDeleteId(null);
    } catch {
      // tetap tutup — onSnapshot live memberi kebenaran data; error tercatat
      console.error("Gagal menghapus laporan:");
      setDeleteId(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <AdminShell
      description="Semua laporan yang sudah ditinjau — sunting link berita pendukung atau hapus laporan."
    >
      {isAdmin && (
        <>
          <section aria-label="Riwayat laporan">
            <h2 className="text-base font-extrabold text-slate-700">
              Riwayat ({visible.length} dari {reviewed.length})
            </h2>

            {/* Filter tampilan — murni klien, tak mengubah data */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="riwayat-type-filter"
                  className="block text-xs font-bold text-slate-700"
                >
                  Jenis kejadian
                </label>
                <select
                  id="riwayat-type-filter"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as ReportType | "semua")
                  }
                  className="mt-1 min-h-[44px] w-full rounded-xl border-2 border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
                >
                  <option value="semua">Semua jenis</option>
                  {TYPE_KEYS.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="riwayat-status-filter"
                  className="block text-xs font-bold text-slate-700"
                >
                  Status
                </label>
                <select
                  id="riwayat-status-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ReportStatus | "semua")
                  }
                  className="mt-1 min-h-[44px] w-full rounded-xl border-2 border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
                >
                  <option value="semua">Semua status</option>
                  {STATUS_KEYS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {reports !== null && visible.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {reviewed.length === 0
                    ? "Belum ada laporan yang ditinjau."
                    : "Tidak ada laporan yang cocok dengan filter ini."}
                </p>
              )}
              {visible.map((r) => (
                <div key={r.id}>
                  <ReportCard report={r} showStatus />
                  {/* Kelola laporan terverifikasi: sunting link berita / hapus */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-brand bg-white text-sm font-bold text-brand hover:bg-brand/10"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />{" "}
                      {r.sourceURL ? "Sunting Berita" : "Tambah Berita"}
                    </button>
                    <button
                      onClick={() => setDeleteId(r.id)}
                      aria-label={`Hapus laporan ${r.title}`}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-sos bg-white text-sm font-bold text-sos hover:bg-sos/10"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Modal edit laporan terverifikasi — tambah/sunting link berita */}
          {editId && editingReport && (
            <Modal
              label="Sunting link berita laporan"
              onClose={() => {
                if (!editBusy) setEditId(null);
              }}
            >
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <Pencil aria-hidden="true" className="h-6 w-6 text-brand" />{" "}
                  Sunting Laporan Terverifikasi
                </h2>
                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {editingReport.title}
                </p>
                <label
                  htmlFor="edit-source-url"
                  className="mt-4 block text-xs font-bold text-slate-700"
                >
                  Link berita pendukung
                </label>
                <input
                  id="edit-source-url"
                  type="url"
                  value={editURL}
                  onChange={(e) => {
                    setEditURL(e.target.value);
                    setEditError(null);
                  }}
                  maxLength={300}
                  placeholder="https://www.detik.com/…"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
                />
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Newspaper aria-hidden="true" className="h-3 w-3" />
                  Kosongkan untuk menghapus sumber. Wajib https:// bila diisi.
                  Warga melihat sumber sebagai &quot;nama-domain&quot; yang
                  bisa diklik.
                </p>
                {editError && (
                  <p role="alert" className="mt-1 text-sm font-bold text-sos">
                    {editError}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={editBusy}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                  >
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                    {editBusy ? "Menyimpan…" : "Simpan"}
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    disabled={editBusy}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    <X aria-hidden="true" className="h-4 w-4" /> Batal
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Modal konfirmasi hapus laporan — dua-langkah, bukan window.confirm */}
          {deleteId && deletingReport && (
            <Modal
              label="Konfirmasi hapus laporan"
              onClose={() => {
                if (!deleteBusy) setDeleteId(null);
              }}
            >
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <Trash2 aria-hidden="true" className="h-6 w-6 text-sos" />{" "}
                  Hapus Laporan?
                </h2>
                <p className="mt-2 rounded-xl bg-sos/5 p-3 text-sm font-semibold text-slate-700">
                  &quot;{deletingReport.title}&quot; akan dihapus permanen —
                  marker hilang dari peta dan feed Info Bahaya. Tindakan ini
                  tidak bisa dibatalkan.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={removeReport}
                    disabled={deleteBusy}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-sos text-sm font-bold text-white hover:bg-sos-dark disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deleteBusy ? "Menghapus…" : "Ya, Hapus"}
                  </button>
                  <button
                    onClick={() => setDeleteId(null)}
                    disabled={deleteBusy}
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
