
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from "@/components/layout/welcome";
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya ha iniciado sesión, no debería estar en esta página.
    // Lo redirigimos a su calendario.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Muestra un loader mientras se determina si redirigir o no, para evitar parpadeos.
  if (loading || user) {
     return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  // Si no está autenticado, muestra el componente de bienvenida.
  return (
    <Welcome />
  );
}
