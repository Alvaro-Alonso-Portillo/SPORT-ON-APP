
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { useAuth } from "@/hooks/use-auth";
import Welcome from "@/components/layout/welcome";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Muestra el componente de bienvenida como un marcador de posición de carga
    // para evitar un parpadeo de contenido vacío mientras se redirige.
    return <Welcome />;
  }
  
  // Renderiza el calendario solo cuando el usuario está autenticado y la carga ha finalizado.
  return (
    <div className="h-full w-full p-4 md:p-8">
      {user && <WeeklyCalendar />}
    </div>
  );
}
