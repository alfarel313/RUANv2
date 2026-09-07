"use client";

import { loginGoogle } from "@/lib/firebase";

export default function LoginGate() {
  return (
    <section
      aria-label="Masuk untuk mulai menggunakan RUAN"
      className="mx-auto max-w-md px-4 pb-10 pt-6"
    >
      <div className="rounded-2xl border-2 border-brand bg-white p-6 text-center shadow-lg">
        <p className="text-base font-semibold text-slate-800">
          Masuk dengan Google untuk melihat peta hidup, check-in keramaian,
          dan akses tombol darurat.
        </p>
        <button
          onClick={() => loginGoogle()}
          className="mx-auto mt-4 flex min-h-[56px] w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-brand px-6 text-base font-bold text-white transition-colors hover:bg-brand-dark"
        >
          <span aria-hidden="true" className="text-xl">
            🔐
          </span>
          Masuk dengan Google
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Akun admin: verifikasi laporan oleh admin Kota Bekasi
          (alfarel3134@gmail.com)
        </p>
      </div>
    </section>
  );
}
