"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { useMapFilters, PLACE_KEYS, REPORT_KEYS } from "@/components/MapFiltersContext";
import InfoDot from "@/components/InfoDot";
import { PLACE_LUCIDE, REPORT_LUCIDE, PLACE_COLORS } from "@/lib/IconMap";
import { PLACE_LABELS } from "@/lib/places";
import type { ReportType } from "@/lib/types";

const REPORT_LABELS: Record<ReportType, string> = {
  banjir: "Banjir",
  kebakaran: "Kebakaran",
  kejahatan: "Kejahatan",
  jalan_rusak: "Jalan Rusak",
  kehilangan: "Kehilangan",
  lainnya: "Lainnya",
};

function FilterRow({
  Icon,
  label,
  checked,
  onChange,
  color,
}: {
  Icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: () => void;
  /** Warna kategori — legenda konsisten dengan warna marker di peta */
  color?: string;
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
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          style={color ? { color } : undefined}
        />{" "}
        {label}
      </span>
      {/* sakelar visual + status teks (bukan hanya warna â€” a11y lansia) */}
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
  Icon,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  Icon: LucideIcon;
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
        <Icon aria-hidden="true" className="h-4 w-4" /> {label}
        {open ? (
          <ChevronUp aria-hidden="true" className="h-3 w-3" />
        ) : (
          <ChevronDown aria-hidden="true" className="h-3 w-3" />
        )}
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

/** Dua dropdown filter peta â€” kanan atas; RouteCard bergeser turun bila keduanya tampil */
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
          Icon={PLACE_LUCIDE.pos_keamanan}
          open={placeOpen}
          onOpenChange={setPlaceOpen}
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500">
              Tampilkan/hide pin per kategori
            </span>
            <InfoDot text="Filter ini hanya menyembunyikan pin di peta â€” tempatnya tetap dihitung sebagai kandidat bantuan SOS dan Rute Aman. Pilihan kembali normal saat halaman dibuka ulang." />
          </div>
          <div className="max-h-[46dvh] space-y-0.5 overflow-y-auto">
            {PLACE_KEYS.map((k) => (
              <FilterRow
                key={k}
                Icon={PLACE_LUCIDE[k]}
                label={PLACE_LABELS[k]}
                checked={filters.places[k]}
                onChange={() => togglePlace(k)}
                color={PLACE_COLORS[k]}
              />
            ))}
            <div className="my-1 border-t border-slate-200" />
            <FilterRow
              Icon={Users}
              label="Keramaian (Beacon)"
              checked={filters.showBeacons}
              onChange={toggleBeacons}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={allPlacesHidden ? allPlacesOn : allPlacesOff}
              className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-extrabold ${
                allPlacesHidden
                  ? "bg-brand/10 text-brand hover:bg-brand/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {allPlacesHidden ? (
                <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {allPlacesHidden ? "Tampilkan Semua" : "Sembunyikan Semua"}
            </button>
            <button
              type="button"
              onClick={allPlacesOn}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-brand/10 text-xs font-extrabold text-brand hover:bg-brand/20"
            >
              <Check aria-hidden="true" className="h-3.5 w-3.5" /> Semua Tampil
            </button>
          </div>
        </DropdownShell>

        <DropdownShell
          label="Kejadian"
          Icon={REPORT_LUCIDE.kejahatan}
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
                Icon={REPORT_LUCIDE[k]}
                label={REPORT_LABELS[k]}
                checked={filters.reports[k]}
                onChange={() => toggleReport(k)}
              />
            ))}
            <div className="my-1 border-t border-slate-200" />
            <FilterRow
              Icon={Compass}
              label="Insiden Rute Aktif"
              checked={filters.showRouteIncidents}
              onChange={toggleRouteIncidents}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={allReportsHidden ? allReportsOn : allReportsOff}
              className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-xs font-extrabold ${
                allReportsHidden
                  ? "bg-amber/10 text-amber hover:bg-amber/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {allReportsHidden ? (
                <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {allReportsHidden ? "Tampilkan Semua" : "Sembunyikan Semua"}
            </button>
            <button
              type="button"
              onClick={allReportsOn}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-amber/10 text-xs font-extrabold text-amber hover:bg-amber/20"
            >
              <Check aria-hidden="true" className="h-3.5 w-3.5" /> Semua Tampil
            </button>
          </div>
        </DropdownShell>
      </div>
    </div>
  );
}
