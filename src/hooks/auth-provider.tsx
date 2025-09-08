
"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/user-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, fetchUserProfile, clearUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchUserProfile(user.uid);
      } else {
        clearUser();
      }
    });

    return () => unsubscribe();
  }, [setUser, fetchUserProfile, clearUser]);

  return <>{children}</>;
}
