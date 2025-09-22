
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from "@/components/layout/welcome";

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

  // Si el usuario está autenticado, el efecto anterior lo redirigirá.
  // Mientras tanto, o si no está autenticado, muestra el componente de bienvenida.
  return (
    <Welcome />
  );
}
