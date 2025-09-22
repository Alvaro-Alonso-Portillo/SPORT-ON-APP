
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from '@/components/layout/welcome';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha terminado y el usuario está autenticado, lo redirigimos a su calendario.
    // La página de bienvenida actúa como la página de inicio pública por defecto.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Muestra el componente de bienvenida mientras se verifica la sesión
  // o si el usuario no está autenticado.
  return <Welcome />;
}
