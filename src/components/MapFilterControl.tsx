"use client";

import { useEffect, useRef, useState } from "react";
import { useMapFilters, PLACE_KEYS, REPORT_KEYS } from "@/components/MapFiltersContext";
import InfoDot from "@/components/InfoDot";
import type { PlaceType, ReportType } from "@/lib/types";

const PLACE_META: Record<PlaceType, { label: string; icon: string }> = {
  polisi: { label: "Kantor Polisi", icon: "👮" },
  rumah_sakit: { label: "Rumah Sakit", icon: "🏥" },
  puskesmas: { label: "Puskesmas", icon: "🩺" },
  masjid: { label: "Masjid", icon: "🕌" },
  toko: { label: "Minimarket", icon: "🏪" },
  mall: { label: "Mal", icon: "🏬" },
  stasiun: { label: "Stasiun", icon: "🚉" },
  pos_keamanan: { label: "Pos Keamanan", icon: "🛟" },
};

const REPORT_META: Record<ReportType, { label: string; icon: string }> = {
  banjir: { label: "Banjir", icon: "🌊" },
  kebakaran: { label: "Kebakaran", icon: "🔥" },
  kejahatan: { label: "Kejahatan", icon: "🚨" },
  jalan_rusak: { label: "Jalan Rusak", icon: "🕳️" },
  kehilangan: { label: "Kehilangan", icon: "❓" },
  lainnya: { label: "Lainnya", icon: "📋" },
};

function FilterRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-slate-100"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span aria-hidden="true">{icon}</span> {label}
      </span>
      {/* sakelar visual + status teks (bukan hanya warna — a11y lansia) */}
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
            checked ? "bg-brand" : "bg-slate-300"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
        <span
          className={`w-8 text-right text-[10px] font-extrabold ${
            checked ? "text-brand" : "text-slate-500"
          }`}
        >
          {checked ? "ON" : "OFF"}
        </span>
      </span>
    </button>
  );
}

function DropdownShell({
  label,
  icon,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  icon: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // tutup saat ketuk di luar panel ATAU tekan Escape (navigasi keyboard)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: TouchEvent | MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 px-3 text-xs font-extrabold shadow-md ${
          open
            ? "border-brand bg-brand text-white"
            : "border-slate-200 bg-white/95 text-slate-700"
        }`}
      >
        <span aria-hidden="true">{icon}</span> {label}
        <span aria-hidden="true" className="text-[9px]">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 z-[600] mt-1.5 w-60 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Dua dropdown filter peta — kanan atas; RouteCard bergeser turun bila keduanya tampil */
export default function MapFilterControl() {
  const {
    filters,
    togglePlace,
    toggleBeacons,
    toggleReport,
    toggleRouteIncidents,
    allPlacesOn,
    allReportsOn,
    allPlacesOff,
    allReportsOff,
  } = useMapFilters();
  const [placeOpen, setPlaceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const allPlacesHidden = PLACE_KEYS.every((k) => !filters.places[k]);
  const allReportsHidden = REPORT_KEYS.every((k) => !filters.reports[k]);

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-[500] flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <DropdownShell
          label="Tempat Aman"
          icon="📍"
          open={placeOpen}
          onOpenChange={setPlaceOpen}
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500">
              Tampilkan/hide pin per kategori
            </span>
            <InfoDot text="Filter ini hanya menyembunyikan pin di peta — tempatnya tetap dihitung sebagai kandidat bantuan SOS dan Rute Aman. Pilihan kembali normal saat halaman dibuka ulang." />
          </div>
          <div className="max-h-[46dvh] space-y-0.5 overflow-y-auto">
            {PLACE_KEYS.map((k) => (
              <FilterRow
                key={k}
                icon={PLACE_META[k].icon}
                label={PLACE_META[k].label}
                checked={filters.places[k]}
                onChange={() => togglePlace(k)}
              />
            ))}
            <div className="my-1 border-t border-slate-200" />
            <FilterRow
              icon="👥"
              label="Keramaian (Beacon)"
              checked={filters.showBeacons}
              onChange={toggleBeacons}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={allPlacesHidden ? allPlacesOn : allPlacesOff}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold ${
                allPlacesHidden
                  ? "bg-brand/10 text-brand hover:bg-brand/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {allPlacesHidden ? "👁 Tampilkan Semua" : "🙈 Sembunyikan Semua"}
            </button>
            <button
              type="button"
              onClick={allPlacesOn}
              className="min-h-[44px] rounded-xl bg-brand/10 text-xs font-extrabold text-brand hover:bg-brand/20"
            >
              ✔ Semua Tampil
            </button>
          </div>
        </DropdownShell>

        <DropdownShell
          label="Kejadian"
          icon="⚠️"
          open={reportOpen}
          onOpenChange={setReportOpen}
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500">
              Marker laporan terverifikasi admin
            </span>
            <InfoDot text="Laporan warga yang sudah diverifikasi admin. Marker hilang otomatis saat laporan tidak lagi relevan: kejahatan 7 hari, banjir 2 hari, lainnya 7 hari." />
          </div>
          <div className="max-h-[46dvh] space-y-0.5 overflow-y-auto">
            {REPORT_KEYS.map((k) => (
              <FilterRow
                key={k}
                icon={REPORT_META[k].icon}
                label={REPORT_META[k].label}
                checked={filters.reports[k]}
                onChange={() => toggleReport(k)}
              />
            ))}
            <div className="my-1 border-t border-slate-200" />
            <FilterRow
              icon="🧭"
              label="Insiden Rute Aktif"
              checked={filters.showRouteIncidents}
              onChange={toggleRouteIncidents}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={allReportsHidden ? allReportsOn : allReportsOff}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold ${
                allReportsHidden
                  ? "bg-amber/10 text-amber hover:bg-amber/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {allReportsHidden ? "👁 Tampilkan Semua" : "🙈 Sembunyikan Semua"}
            </button>
            <button
              type="button"
              onClick={allReportsOn}
              className="min-h-[44px] rounded-xl bg-amber/10 text-xs font-extrabold text-amber hover:bg-amber/20"
            >
              ✔ Semua Tampil
            </button>
          </div>
        </DropdownShell>
      </div>
    </div>
  );
}
