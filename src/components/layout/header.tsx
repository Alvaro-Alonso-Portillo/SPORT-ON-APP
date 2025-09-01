
"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import SidebarContent from "./sidebar-content";

export default function Header() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-40 h-20 flex items-center px-4 md:px-8 border-b md:hidden">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px]">
             <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex-1 text-center">
          <Link href="/" className="text-3xl font-headline font-bold text-foreground">
            Sport <span className="text-primary">ON</span>
          </Link>
      </div>
      <div className="w-10"></div>
    </header>
  );
}
