
"use client";

import { useUserStore } from "@/store/user-store";

// Custom hook to access auth state, now sourced from Zustand
export const useAuth = () => {
    const { user, userProfile, isLoading, isSuperAdmin, fetchUserProfile } = useUserStore();
    return { user, userProfile, loading: isLoading, isSuperAdmin, fetchUserProfile };
};
