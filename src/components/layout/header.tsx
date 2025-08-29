"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, User, Calendar, History } from "lucide-react";
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
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          Class Commander
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/">
                  <Calendar className="mr-0 md:mr-2 h-4 w-4" /> 
                  <span className="hidden md:inline">Calendar</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/bookings">
                  <History className="mr-0 md:mr-2 h-4 w-4" /> 
                  <span className="hidden md:inline">My Bookings</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-0 md:mr-2 h-4 w-4" /> 
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <User className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
