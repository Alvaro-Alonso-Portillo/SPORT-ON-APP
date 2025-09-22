
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from '@/components/layout/welcome';
import SignupForm from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
  
  // Si el usuario ya está logueado, se redirigirá. Si no, muestra el formulario.
  // No mostramos nada si ya hay un usuario para evitar un parpadeo del formulario antes de la redirección.
  if (user) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <Card className="w-full max-w-sm mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Regístrate</CardTitle>
          <CardDescription>
            Crea tu cuenta con tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
