"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import PlaceAdminSection from "@/components/PlaceAdminSection";
import { useAuth } from "@/hooks/useAuth";
import { PLACE_CATEGORIES } from "@/lib/places";
import type { PlaceType } from "@/lib/types";

export default function AdminTempatPage() {
  const { userData } = useAuth();
  const isAdmin = userData?.role === "admin";
  const [filter, setFilter] = useState<PlaceType | "semua">("semua");

  return (
    <AdminShell
      description="Kelola titik lokasi aman — tambah, perbaiki koordinat/jam, atau hapus. Perubahan tampil live di peta."
    >
      {isAdmin && (
        <>
          {/* Filter kategori â€” pakai satu sumber PLACE_CATEGORIES */}
          <div className="mt-2 flex items-center gap-2">
            <label
              htmlFor="place-filter"
              className="text-xs font-bold text-slate-700"
            >
              Kategori
            </label>
            <select
              id="place-filter"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as PlaceType | "semua")
              }
              className="min-h-[44px] flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-brand focus:outline-none"
            >
              <option value="semua">Semua kategori</option>
              {PLACE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <PlaceAdminSection filter={filter} />
        </>
      )}
    </AdminShell>
  );
}
