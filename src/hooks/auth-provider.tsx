"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/user-store";


export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, fetchUserProfile, clearUser, setShowPhotoMotivationModal } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userProfile = await fetchUserProfile(user.uid);

        // Check if the user profile exists and doesn't have a photoURL
        if (userProfile && !userProfile.photoURL) {
           setTimeout(() => {
              setShowPhotoMotivationModal(true);
           }, 1500); // Delay modal to not overwhelm user immediately
        }

      } else {
        clearUser();
      }
    });

    return () => unsubscribe();
  }, [setUser, fetchUserProfile, clearUser, setShowPhotoMotivationModal]);

  return <>{children}</>;
}
