"use client";

/**
 * Skeleton loading a11y-friendly: blok berdenyut menandakan area memuat.
 * Container pembungkus bertanggung jawab memberi role="status" + teks SR-only.
 */
export default function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
  );
}

/** Pembungkus daftar konten yang sedang dimuat — layar pembaca mengumumkan sekali */
export function SkeletonList({
  label,
  count = 3,
  item = "h-28",
}: {
  label: string;
  count?: number;
  item?: string;
}) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={`${item} w-full`} />
        ))}
      </div>
    </div>
  );
}
