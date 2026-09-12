"use client";

import { Megaphone } from "lucide-react";
import ReportForm from "@/components/ReportForm";

export default function LaporPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Megaphone aria-hidden="true" className="h-7 w-7" /> Lapor Kejadian
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Bantu warga Bekasi terhindar dari bahaya. Laporan Anda diverifikasi
        admin sebelum tampil publik.
      </p>
      <div className="mt-4">
        <ReportForm />
      </div>
    </main>
  );
}
