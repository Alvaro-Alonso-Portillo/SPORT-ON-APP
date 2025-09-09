
"use client"

import { useEffect } from "react";
import ProfileForm from "@/components/profile/profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);


  if (authLoading) {
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
      <ProfileForm />
    </div>
  );
}
