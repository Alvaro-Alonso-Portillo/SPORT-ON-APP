"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="h-2 bg-teal-800"></div>
      <nav className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="text-4xl font-headline font-bold text-gray-800">
          Sport <span className="text-primary">ON</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : user ? (
            <>
               <Button variant="ghost" asChild>
                <Link href="/bookings">
                  Mis Reservas
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="mr-0 md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Anular Reserva</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <User className="mr-2 h-4 w-4" /> Registrarse
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
