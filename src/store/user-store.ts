import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  showPhotoMotivationModal: boolean;
  setUser: (user: User | null) => void;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
  clearUser: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setShowPhotoMotivationModal: (show: boolean) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isSuperAdmin: false,
  showPhotoMotivationModal: false,
  setUser: (user) => {
    set({ user });
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        const isSuperAdmin = !!idTokenResult.claims.role && idTokenResult.claims.role === 'superadmin';
        set({ isSuperAdmin });
      });
    } else {
      set({ isSuperAdmin: false });
    }
  },
  fetchUserProfile: async (uid: string) => {
    set({ isLoading: true });
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        set({ userProfile: profile, isLoading: false });
        return profile;
      } else {
        set({ userProfile: null, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      set({ userProfile: null, isLoading: false });
      return null;
    }
  },
  clearUser: () => set({ user: null, userProfile: null, isLoading: false, isSuperAdmin: false }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setShowPhotoMotivationModal: (show) => set({ showPhotoMotivationModal: show }),
}));
