
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SidebarContent() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Calendario", icon: Home },
    { href: "/bookings", label: "Mis Reservas", icon: CalendarDays },
  ];

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b">
            {loading ? (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded-md" />
                    </div>
                </div>
            ) : user ? (
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{user.displayName || user.email?.split('@')[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">Invitado</p>
                        <p className="text-xs text-muted-foreground">Inicia sesión para reservar</p>
                    </div>
                </div>
            )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === link.href && "bg-primary/10 text-primary"
                    )}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="mt-auto p-4 border-t">
            <p className="text-xs text-muted-foreground">&copy; 2024 Sport ON</p>
        </div>
    </div>
  );
}
