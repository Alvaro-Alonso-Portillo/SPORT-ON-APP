
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from '@/components/layout/welcome';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Una vez que la carga de autenticación ha terminado...
    if (!loading) {
      // Si el usuario ha iniciado sesión, lo redirigimos a su calendario.
      if (user) {
        router.replace('/dashboard');
      } else {
      // Si no ha iniciado sesión, lo redirigimos a la página de bienvenida pública.
        router.replace('/welcome');
      }
    }
  }, [user, loading, router]);

  // Muestra el componente Welcome como un indicador de carga mientras se decide a dónde redirigir.
  return <Welcome />;
}
