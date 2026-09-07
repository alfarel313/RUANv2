import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserSettings, UserData } from "@/lib/types";

export const ADMIN_EMAILS = ["alfarel3134@gmail.com"];

export function DEFAULT_SETTINGS(): UserSettings {
  return { largeText: false, highContrast: false, audioAlert: true, notifications: true };
}

export function DEFAULT_USER_DATA(user: FirebaseUser): UserData {
  return {
    displayName: user.displayName ?? "Warga",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    role: ADMIN_EMAILS.includes(user.email ?? "") ? "admin" : "user",
    city: "Bekasi",
    settings: DEFAULT_SETTINGS(),
  };
}

/** Buat dokumen users/{uid} bila belum ada; idempotent, dipanggil saat login. */
export async function ensureUserDoc(user: FirebaseUser): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...DEFAULT_USER_DATA(user),
      createdAt: serverTimestamp(),
    });
  }
}
