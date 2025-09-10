
"use client";

import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { useAuth } from "@/hooks/use-auth";
import Welcome from "@/components/layout/welcome";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    // Muestra el componente de bienvenida como un marcador de posición de carga
    // o si el usuario no está autenticado. El layout se encargará de mostrar
    // las opciones de login/signup.
    return <Welcome />;
  }
  
  // Renderiza el calendario solo cuando el usuario está autenticado y la carga ha finalizado.
  return (
    <div className="h-full w-full p-4 md:p-8">
      <WeeklyCalendar />
    </div>
  );
}
