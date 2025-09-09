
"use client"

import { useState, useEffect } from "react";
import ProfileForm from "@/components/profile/profile-form";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { ClassInfo } from "@/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      const fetchUserBookings = async () => {
        setIsLoadingBookings(true);
        try {
          const classesRef = collection(db, "classes");
          const q = query(classesRef, where("attendees", "array-contains-any", [
              { uid: user.uid, name: user.displayName || '' },
              { uid: user.uid, name: user.displayName || '', photoURL: user.photoURL || null },
              { uid: user.uid, name: user.displayName || '', photoURL: user.photoURL || undefined }
          ]));
          
          const querySnapshot = await getDocs(q);
          const bookingIds = querySnapshot.docs.map(doc => doc.id);
          setUserBookings(bookingIds);

        } catch (error) {
          console.error("Error fetching user bookings for profile page:", error);
        } finally {
          setIsLoadingBookings(false);
        }
      };

      fetchUserBookings();
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoadingBookings) {
     return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-headline text-2xl md:text-4xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gestiona tu información personal. Los cambios se guardarán en tu perfil.
        </p>
      </div>
      <ProfileForm userBookings={userBookings} />
    </div>
  );
}
