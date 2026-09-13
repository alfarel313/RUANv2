// Akses koleksi reports — SATU sumber untuk semua konsumen (peta rute, SOS).
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReportData } from "@/lib/types";

/**
 * Ambil semua laporan. Gagal jaringan → [] (rute tetap jalan tanpa insiden,
 * tidak crash — anti gagal demo). Filter status/kota/umur dilakukan di
 * routing.ts (activeReports) supaya logika scoring tetap murni & teruji.
 */
export async function fetchAllReports(): Promise<ReportData[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "reports"), where("status", "==", "verified"))
    );
    const list: ReportData[] = [];
    snap.forEach((d) => list.push(d.data() as ReportData));
    return list;
  } catch {
    return [];
  }
}
