
"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, Menu, UserPlus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import SidebarContent from "./sidebar-content";
import { useAuth } from "@/hooks/use-auth";
import UserMenu from "./user-menu";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, loading } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40 h-20 flex items-center px-4 md:px-8 border-b">
       <div className="flex items-center gap-4">
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
           <Link href="/" className="text-xl md:text-3xl font-headline font-bold text-foreground hidden sm:block">
             Sport <span className="text-primary">ON</span>
          </Link>
      </div>

      <div className="flex-1 text-center sm:hidden">
          <Link href="/" className="text-2xl font-headline font-bold text-foreground">
             Sport <span className="text-primary">ON</span>
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
