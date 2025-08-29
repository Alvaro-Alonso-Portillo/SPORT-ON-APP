
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, User, CalendarDays } from "lucide-react";
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
        <div className="flex-1"></div>
        <div className="flex-1 text-center">
            <Link href="/" className="text-3xl md:text-4xl font-headline font-bold text-gray-800">
              Sport <span className="text-primary">ON</span>
            </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1 md:gap-4">
          {loading ? (
            <div className="flex items-center gap-2 md:gap-4">
              <Skeleton className="h-10 w-10 md:w-24" />
              <Skeleton className="h-10 w-10 md:w-24" />
            </div>
          ) : user ? (
            <>
               <Button variant="ghost" asChild>
                <Link href="/bookings">
                  <CalendarDays className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Mis Reservas</span>
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Salir</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline"> Iniciar Sesión</span>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <User className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Registrarse</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

    