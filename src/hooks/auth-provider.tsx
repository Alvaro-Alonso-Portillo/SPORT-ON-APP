"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/user-store";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const photoMotivationToasts = [
    {
        title: "¡Dale vida a tu perfil!",
        description: "Una foto te ayuda a conectar con la comunidad. ¡Sube la tuya!",
    },
    {
        title: "¡Muestra tu mejor cara!",
        description: "Personaliza tu perfil con una foto. ¡Es rápido y fácil!",
    },
    {
        title: "Un perfil completo",
        description: "Los perfiles con foto son más reconocibles. ¡No te quedes atrás!",
    },
    {
        title: "¡Conéctate con Sport ON!",
        description: "Añadir una foto es el primer paso para sentirte parte del equipo.",
    }
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, setUser, fetchUserProfile, clearUser } = useUserStore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userProfile = await fetchUserProfile(user.uid);

        if (userProfile && !userProfile.photoURL) {
            const randomToast = photoMotivationToasts[Math.floor(Math.random() * photoMotivationToasts.length)];
            setTimeout(() => {
                 toast({
                    ...randomToast,
                    action: (
                       <Button asChild variant="secondary" size="sm">
                         <Link href="/profile">Añadir Foto</Link>
                       </Button>
                    ),
                    duration: 8000, // Show for 8 seconds
                });
            }, 1500); // Delay toast to not overwhelm user immediately
        }

      } else {
        clearUser();
      }
    });

    return () => unsubscribe();
  }, [setUser, fetchUserProfile, clearUser, toast, router]);

  return <>{children}</>;
}
