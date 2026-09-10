"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserData } from "@/lib/types";
import { DEFAULT_SETTINGS, DEFAULT_USER_DATA, ensureUserDoc } from "@/lib/user";

interface AuthState {
  user: FirebaseUser | null;
  userData: UserData | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
  });

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubDoc?.();
      if (user) {
        try {
          await ensureUserDoc(user);
        } catch (err) {
          // create dokumen bisa ditolak rules (mis. offline/permission) —
          // jangan biarkan rejection bocor; onSnapshot error-callback menangani sisanya
          console.error("ensureUserDoc gagal:", err);
        }
        unsubDoc = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            setState({
              user,
              // normalisasi: dokumen lama mungkin punya field setting hilang/bentuk lama
              // (mis. highContrast era sebelumnya) — merge default agar selalu boolean
              userData: snap.exists()
                ? {
                    ...(snap.data() as UserData),
                    settings: { ...DEFAULT_SETTINGS(), ...(snap.data() as UserData).settings },
                  }
                : DEFAULT_USER_DATA(user),
              loading: false,
            });
          },
          () => setState({ user, userData: null, loading: false })
        );
      } else {
        setState({ user: null, userData: null, loading: false });
      }
    });
    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, []);

  return state;
}
