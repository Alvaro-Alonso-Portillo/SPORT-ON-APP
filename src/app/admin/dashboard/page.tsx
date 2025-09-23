
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha terminado y el usuario no es un superadmin, redirige.
    if (!loading && !isSuperAdmin) {
      router.replace('/login');
    }
  }, [user, loading, isSuperAdmin, router]);

  // Muestra un indicador de carga mientras se verifica el rol y la sesión del usuario.
  if (loading || !isSuperAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Renderiza el dashboard solo cuando el usuario es un superadmin.
  return (
    <div className="h-full w-full p-4 md:p-8">
      <h1 className="font-headline text-2xl md:text-4xl font-bold">Dashboard de Administración</h1>
    </div>
  );
}
