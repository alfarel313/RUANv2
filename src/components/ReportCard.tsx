"use client";

import type { ReportData } from "@/lib/types";
import { reportPhotos, sourceDomain } from "@/lib/types";

export const TYPE_META: Record<string, { label: string; icon: string }> = {
  banjir: { label: "Banjir", icon: "🌊" },
  kebakaran: { label: "Kebakaran", icon: "🔥" },
  kejahatan: { label: "Kejahatan", icon: "🚨" },
  jalan_rusak: { label: "Jalan Rusak", icon: "🕳️" },
  kehilangan: { label: "Kehilangan", icon: "❓" },
  lainnya: { label: "Lainnya", icon: "📋" },
};

export function timeAgo(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export default function ReportCard({
  report,
  showStatus = false,
}: {
  report: ReportData;
  showStatus?: boolean;
}) {
  const meta = TYPE_META[report.type] ?? TYPE_META.lainnya;
  const pics = reportPhotos(report);
  const domain = sourceDomain(report);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl"
          >
            {meta.icon}
          </span>
          <div>
            <h3 className="text-base font-extrabold leading-tight text-slate-900">
              {report.title}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {meta.label} · {timeAgo(report.createdAt)} · oleh{" "}
              {report.reporterName}
            </p>
            {domain && (
              <a
                href={report.sourceURL ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-brand underline decoration-dotted"
              >
                📰 {domain}
              </a>
            )}
          </div>
        </div>
        {showStatus && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              report.status === "verified"
                ? "bg-brand/10 text-brand"
                : report.status === "pending"
                  ? "bg-amber/10 text-amber"
                  : "bg-sos/10 text-sos"
            }`}
          >
            {report.status === "verified"
              ? "✅ Terverifikasi"
              : report.status === "pending"
                ? "⏳ Menunggu"
                : "❌ Ditolak"}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-700">{report.description}</p>
      {pics.length > 0 && (
        <div
          className={`mt-2 grid gap-2 ${
            pics.length > 1 ? "grid-cols-3" : "grid-cols-1"
          }`}
        >
          {pics.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p}
              alt={`Foto laporan ${i + 1}: ${report.title}`}
              className={`rounded-xl border border-slate-200 object-cover ${
                pics.length > 1 ? "h-24 w-full" : "max-h-48 w-full"
              }`}
            />
          ))}
        </div>
      )}
    </article>
  );
}
