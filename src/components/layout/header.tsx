
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import SidebarContent from "./sidebar-content";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-40 h-20 flex items-center px-4 md:px-8 border-b">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
             <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex-1 text-center">
          <Link href="/" className="text-3xl md:text-4xl font-headline font-bold text-gray-800">
            Sport <span className="text-primary">ON</span>
          </Link>
      </div>
      <div className="flex items-center justify-end gap-1 md:gap-4 w-20 md:w-auto">
        {loading ? (
          <div className="flex items-center gap-2 md:gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-24 hidden md:block" />
          </div>
        ) : user ? (
          <>
            <Button variant="destructive" onClick={handleSignOut} size="sm">
              <LogOut className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">
                <LogIn className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline"> Iniciar Sesión</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                <User className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Registrarse</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
