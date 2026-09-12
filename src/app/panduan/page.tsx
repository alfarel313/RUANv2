"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GuideData } from "@/lib/types";
import Link from "next/link";
import { SkeletonList } from "@/components/Skeleton";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  banjir: { label: "Banjir", icon: "🌊" },
  kebakaran: { label: "Kebakaran", icon: "🔥" },
  kejahatan: { label: "Kejahatan", icon: "🚨" },
  anak: { label: "Untuk Anak", icon: "🧒" },
  lansia: { label: "Untuk Lansia", icon: "👵" },
  disabilitas: { label: "Untuk Disabilitas", icon: "♿" },
  umum: { label: "Umum", icon: "🛡️" },
};

export default function PanduanPage() {
  const [guides, setGuides] = useState<GuideData[] | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "guides"), orderBy("order", "asc")))
      .then((snap) => {
        const list: GuideData[] = [];
        snap.forEach((d) => list.push(d.data() as GuideData));
        setGuides(list);
      })
      .catch(() => setGuides([]));
  }, []);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">
        🛡️ Panduan Keselamatan
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Langkah-langkah sederhana saat bahaya — untuk semua umur dan
        kondisi, termasuk lansia, anak-anak, dan penyandang disabilitas.
      </p>

      <div className="mt-4 grid gap-3">
        {guides === null && (
          <SkeletonList label="Memuat panduan" count={5} item="h-20" />
        )}
        {guides?.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl" aria-hidden="true">
              📖
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Belum ada panduan tersimpan. Silakan kembali lagi nanti.
            </p>
          </div>
        )}
        {guides?.map((g) => {
          const meta = CATEGORY_META[g.category] ?? CATEGORY_META.umum;
          return (
            <Link
              key={g.title}
              href={`/panduan/${encodeURIComponent(
                g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              )}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl"
              >
                {meta.icon}
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {g.title}
                </p>
                <p className="text-xs font-semibold text-brand">
                  {meta.label}
                </p>
              </div>
              <span aria-hidden="true" className="ml-auto text-slate-400">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
