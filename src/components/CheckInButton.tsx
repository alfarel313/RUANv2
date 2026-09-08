"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePresenceCtx } from "@/components/PresenceContext";
import { loginGoogle } from "@/lib/firebase";

export default function CheckInButton() {
  const { user } = useAuth();
  const { active, activeCount, start, stop, error } = usePresenceCtx();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => loginGoogle()}
        className="min-h-[56px] flex-1 rounded-2xl border-2 border-brand bg-white px-4 text-sm font-bold text-brand shadow-md"
      >
        📍 Masuk & Check-In
      </button>
    );
  }

  const handle = async () => {
    setBusy(true);
    try {
      if (active) await stop();
      else await start();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1">
      <button
        onClick={handle}
        disabled={busy}
        aria-pressed={active}
        className={`min-h-[64px] w-full rounded-2xl px-4 text-base font-bold shadow-md transition-colors ${
          active
            ? "bg-brand text-white"
            : "border-2 border-brand bg-white text-brand hover:bg-brand/5"
        }`}
      >
        {active ? "✅ Check-In Aktif" : "📍 Check-In di Sini"}
      </button>
      {active && (
        <p
          className="mt-1.5 text-center text-xs font-semibold text-white drop-shadow"
          role="status"
        >
          {activeCount >= 1
            ? `🟢 Beacon aktif — ${activeCount} orang di area Anda`
            : `Menanti ${1 - activeCount} orang lagi untuk membentuk beacon…`}
        </p>
      )}
      {error && (
        <p
          className="mt-1 text-center text-xs font-semibold text-sos"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
