"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GuideData } from "@/lib/types";
import Link from "next/link";

/** Render markdown mini (##, ###, -, **bold**, paragraf) tanpa dependensi */
function MiniMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (b.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-extrabold text-slate-900">
              {b.slice(3)}
            </h2>
          );
        }
        if (b.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-bold text-brand">
              {b.slice(4)}
            </h3>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-none space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-base text-slate-700">
                  <span aria-hidden="true" className="text-brand">
                    •
                  </span>
                  <span>{inline(l.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (/^\d+\./.test(lines[0])) {
          return (
            <ol key={i} className="list-decimal space-y-2 pl-5 text-base text-slate-700">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\.\s*/, ""))}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-slate-700">
            {inline(b)}
          </p>
        );
      })}
    </div>
  );
}

function inline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-extrabold text-slate-900">
        {p.slice(2, -2)}
      </strong>
    ) : (
      p
    )
  );
}

export default function GuideDetailPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "guides"))
      .then((snap) => {
        let found: GuideData | null = null;
        snap.forEach((d) => {
          const g = d.data() as GuideData;
          const gslug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          if (gslug === slug) found = g;
        });
        if (found) setGuide(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-4xl" aria-hidden="true">
          📖
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">
          Panduan tidak ditemukan
        </h1>
        <Link href="/panduan"
          className="mt-4 inline-flex min-h-[48px] items-center rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          ← Semua Panduan
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Link href="/panduan"
        className="text-sm font-bold text-brand hover:underline"
      >
        ← Semua Panduan
      </Link>
      {guide ? (
        <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {guide.title}
          </h1>
          <div className="mt-3">
            <MiniMarkdown content={guide.content} />
          </div>
        </article>
      ) : (
        <p role="status" className="mt-4 text-sm font-semibold text-slate-500">
          Memuat panduan…
        </p>
      )}
    </main>
  );
}
