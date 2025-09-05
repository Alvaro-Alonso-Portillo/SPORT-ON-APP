
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Menu, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import SidebarContent from "./sidebar-content";
import { useAuth } from "@/hooks/use-auth";
import UserMenu from "./user-menu";

export default function Header() {
  const { user, loading } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40 h-20 flex items-center px-4 md:px-8 border-b">
       <div className="flex items-center gap-4">
          {user && (
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px]">
                  <SidebarContent onLinkClick={() => setIsSheetOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
          )}
           <Link href="/" className="hidden sm:block">
             <Image
                src="/logo.png"
                alt="Sport ON Logo"
                width={400}
                height={106}
                className="w-[150px] h-auto"
                priority
              />
          </Link>
      </div>

      <div className="flex-1 text-center sm:hidden">
          <Link href="/">
             <Image
                src="/logo.png"
                alt="Sport ON Logo"
                width={400}
                height={106}
                className="w-[120px] h-auto"
                priority
              />
          </Link>
      </div>
      
      <div className="ml-auto">
        {!loading && (
          user ? (
             <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
               <Button variant="ghost" asChild>
                 <Link href="/login">
                   <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                 </Link>
               </Button>
               <Button asChild>
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" /> Registrarse
                  </Link>
               </Button>
            </div>
          )
        )}
      </div>
    </header>
  );
}
