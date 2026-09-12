"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  onSnapshot,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ReportData } from "@/lib/types";
import { validateSourceURL } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import PlaceAdminSection from "@/components/PlaceAdminSection";
import Modal from "@/components/Modal";
import { SkeletonList } from "@/components/Skeleton";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import {
  ChevronLeft,
  Clock3,
  Newspaper,
  Pencil,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

// Peta (leaflet) WAJIB client-only — ssr:false seperti LocationPicker (lapor)
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

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);

  // Modal verifikasi 2-langkah: link berita opsional → simpan sourceURL + status
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [sourceURL, setSourceURL] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Edit & hapus laporan TERVERIFIKASI/riwayat (admin)
  const [editId, setEditId] = useState<string | null>(null);
  const [editURL, setEditURL] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const editingReport = reviewed.find(
    (r) => (r as ReportData & { id: string }).id === editId
  );

  const deletingReport = reviewed.find(
    (r) => (r as ReportData & { id: string }).id === deleteId
  );

  const openEdit = (r: ReportData & { id: string }) => {
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
              {/* Titik lokasi kejadian — admin memeriksa sebelum verifikasi/tolak */}
              <div className="mt-2">
                <LocationView
                  value={{ lat: r.lat, lng: r.lng }}
                  label="Lokasi kejadian"
                />
              </div>
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
            <div key={i}>
              <ReportCard report={r} showStatus />
              {/* Kelola laporan terverifikasi: sunting link berita / hapus */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => openEdit(r as ReportData & { id: string })}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-brand bg-white text-sm font-bold text-brand hover:bg-brand/10"
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />{" "}
                  {r.sourceURL ? "Sunting Berita" : "Tambah Berita"}
                </button>
                <button
                  onClick={() =>
                    setDeleteId((r as ReportData & { id: string }).id)
                  }
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
            {/* Titik lokasi kejadian di peta — admin memeriksa sebelum memutuskan */}
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
              Warga melihat sumber sebagai &quot;nama-domain&quot; yang bisa
              diklik.
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
              <Trash2 aria-hidden="true" className="h-6 w-6 text-sos" /> Hapus
              Laporan?
            </h2>
            <p className="mt-2 rounded-xl bg-sos/5 p-3 text-sm font-semibold text-slate-700">
              &quot;{deletingReport.title}&quot; akan dihapus permanen —
              marker hilang dari peta dan feed Info Bahaya. Tindakan ini tidak
              bisa dibatalkan.
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
    </main>
  );
}
