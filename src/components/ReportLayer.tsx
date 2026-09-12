"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "@/lib/firebase";
import type { ReportData, ReportType } from "@/lib/types";
import { reportPhotos, sourceDomain } from "@/lib/types";
import { INCIDENT_RULES } from "@/lib/routing";
import { useMapFilters } from "@/components/MapFiltersContext";
import InfoDot from "@/components/InfoDot";
import { REPORT_ICON_DATA, iconSvg } from "@/lib/IconMap";

const LABELS: Record<ReportType, string> = {
  banjir: "Banjir",
  kebakaran: "Kebakaran",
  kejahatan: "Kejahatan",
  jalan_rusak: "Jalan Rusak",
  kehilangan: "Kehilangan",
  lainnya: "Lainnya",
};

/** Marker kejadian: lingkaran amber + ikon jenis (beda bentuk dari pin tempat) */
function reportIcon(type: ReportType): L.DivIcon {
  const icon = iconSvg(REPORT_ICON_DATA[type] ?? REPORT_ICON_DATA.lainnya, 16, "#ffffff");
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#d97706;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
          ${icon}
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function ageText(createdAt: number, now: number): string {
  const h = Math.floor((now - createdAt) / 3600_000);
  if (h < 1) return "baru saja";
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

/**
 * Laporan verified di peta utama — sisi "bahaya yang dihindari" dari cerita
 * keselamatan peta. Live via onSnapshot: admin verifikasi → marker muncul.
 * Window umur sama dengan engine Rute Aman (konsisten), kota Bekasi.
 */
export default function ReportLayer({ now }: { now: number }) {
  const { filters } = useMapFilters();
  const [reports, setReports] = useState<(ReportData & { id: string })[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), where("status", "==", "verified"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: (ReportData & { id: string })[] = [];
        snap.forEach((d) =>
          list.push({ ...(d.data() as ReportData), id: d.id })
        );
        setReports(list);
      },
      () => setReports([])
    );
    return () => unsub();
  }, []);

  const visible = useMemo(
    () =>
      (reports ?? []).filter((r) => {
        if (r.city && r.city !== "Bekasi") return false;
        const rule = INCIDENT_RULES[r.type];
        if (!rule) return false;
        const age = now - r.createdAt;
        return age >= 0 && age <= rule.windowMs && filters.reports[r.type];
      }),
    [reports, now, filters.reports]
  );

  if (!reports) return null;

  return (
    <>
      {visible.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={reportIcon(r.type)}
          title={`Kejadian ${LABELS[r.type]}: ${r.title}`}
          aria-label={`Kejadian ${LABELS[r.type]}: ${r.title}`}
        >
          <Popup>
            <strong>{r.title}</strong>{" "}
            <InfoDot text="Laporan warga yang sudah diverifikasi admin Kota Bekasi. Marker otomatis hilang saat laporan tidak lagi relevan (kejahatan 7 hari, banjir 2 hari, lainnya 7 hari) — dan tetap dihitung sebagai bahaya oleh Rute Aman selama masih relevan." />
            <br />
            {LABELS[r.type]} · {ageText(r.createdAt, now)}
            <br />
            <span style={{ color: "#b45309", fontWeight: 700 }}>
              Terverifikasi admin — hindari area ini
            </span>
            {sourceDomain(r) && (
              <>
                <br />
                <a
                  href={r.sourceURL ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0f766e", fontWeight: 700, fontSize: 12 }}
                >
                  Sumber: {sourceDomain(r)}
                </a>
              </>
            )}
            {reportPhotos(r).length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    reportPhotos(r).length > 1 ? "1fr 1fr" : "1fr",
                  gap: 4,
                  marginTop: 6,
                }}
              >
                {reportPhotos(r).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p}
                    alt={`Foto kejadian ${i + 1}`}
                    style={{
                      width: "100%",
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                ))}
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
