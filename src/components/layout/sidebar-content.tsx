
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, User as UserIcon, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "../ui/user-avatar";

interface SidebarContentProps {
  onLinkClick?: () => void;
}

export default function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const { user, userProfile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    if (onLinkClick) onLinkClick();
    try {
      await signOut(auth);
      router.push("/welcome");
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cerrar la sesión. Por favor, inténtalo de nuevo.",
        });
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Calendario", icon: Home },
    { href: "/bookings", label: "Mis Reservas", icon: CalendarDays },
    { href: "/profile", label: "Mi Perfil", icon: UserIcon },
  ];

  if (loading) {
    return (
       <div className="flex flex-col h-full bg-card text-card-foreground p-4">
        <div className="p-2 border-b mb-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="p-2 border-b mb-2">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
                <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded-md" />
                </div>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </nav>
        <div className="mt-auto p-2 border-t">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    )
  }

  const logo = (
     <Image
        src="/logo.png"
        alt="Sport ON Logo"
        width={180}
        height={48}
        className="h-auto w-auto"
        priority
      />
  );

  if (!user || !userProfile) {
    return (
       <div className="flex flex-col h-full bg-card text-card-foreground p-4 items-center justify-center text-center">
          <div className="p-6 border-b">
             <Link href="/welcome" onClick={onLinkClick}>
                {logo}
            </Link>
          </div>
          <div className="p-6">
              <p className="text-muted-foreground mb-4">Inicia sesión para ver tu calendario y gestionar tus reservas.</p>
              <Button asChild onClick={onLinkClick}>
                  <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                  </Link>
              </Button>
          </div>
       </div>
    );
  }

  const userName = userProfile.name || user.displayName || user.email?.split('@')[0] || "Usuario";

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
        <div className="p-6 border-b">
             <Link href="/dashboard" onClick={onLinkClick}>
                {logo}
            </Link>
        </div>
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
              <UserAvatar user={userProfile} className="h-12 w-12" />
              <div>
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    onClick={onLinkClick}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base font-medium",
                        pathname === link.href && "bg-accent text-primary"
                    )}
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="mt-auto p-4 border-t">
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start p-3">
                <LogOut className="mr-3 h-5 w-5" />
                Salir
            </Button>
        </div>
    </div>
  );
}
