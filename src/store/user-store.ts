import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchUserProfile: (uid: string) => Promise<void>;
  clearUser: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  fetchUserProfile: async (uid: string) => {
    set({ isLoading: true });
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ userProfile: docSnap.data() as UserProfile, isLoading: false });
      } else {
        set({ userProfile: null, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      set({ userProfile: null, isLoading: false });
    }
  },
  clearUser: () => set({ user: null, userProfile: null, isLoading: false }),
  setUserProfile: (profile) => set({ userProfile: profile }),
}));
