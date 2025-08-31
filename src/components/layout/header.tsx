
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
    <header className="bg-card shadow-sm sticky top-0 z-40 h-20 flex items-center px-4 md:px-8 border-b md:hidden">
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
          <Link href="/" className="text-3xl font-headline font-bold text-gray-800">
            Sport <span className="text-primary">ON</span>
          </Link>
      </div>
      <div className="w-10"></div>
    </header>
  );
}
