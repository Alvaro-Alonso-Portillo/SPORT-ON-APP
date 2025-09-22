
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha terminado y no hay usuario, redirige a la página de login.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Muestra un indicador de carga mientras se verifica la sesión del usuario.
  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Renderiza el calendario solo cuando el usuario está autenticado y la carga ha finalizado.
  return (
    <div className="h-full w-full p-4 md:p-8">
      <WeeklyCalendar />
    </div>
  );
}

