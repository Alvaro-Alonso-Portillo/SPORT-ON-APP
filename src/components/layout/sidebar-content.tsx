
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, User as UserIcon, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";


export default function SidebarContent() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const navLinks = [
    { href: "/", label: "Calendario", icon: Home },
    { href: "/bookings", label: "Mis Reservas", icon: CalendarDays },
    { href: "/profile", label: "Mi Perfil", icon: UserIcon },
  ];

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b">
             <Link href="/" className="text-3xl font-headline font-bold text-gray-800">
                Sport <span className="text-primary">ON</span>
            </Link>
        </div>
        <div className="p-6 border-b">
            {loading ? (
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded-md" />
                    </div>
                </div>
            ) : user ? (
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.displayName || user.email?.split('@')[0]}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Avatar  className="h-12 w-12">
                        <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Invitado</p>
                        <p className="text-sm text-muted-foreground">Inicia sesión para reservar</p>
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
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base font-medium",
                        pathname === link.href && "bg-primary/10 text-primary"
                    )}
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="mt-auto p-4 border-t">
             {loading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            ) : user ? (
                <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start p-3">
                    <LogOut className="mr-3 h-5 w-5" />
                    Salir
                </Button>
             ) : (
                <Button variant="ghost" asChild className="w-full justify-start p-3">
                    <Link href="/login">
                        <LogIn className="mr-3 h-5 w-5" />
                       Iniciar Sesión
                    </Link>
                </Button>
            )}
        </div>
    </div>
  );
}
