
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from '@/components/layout/welcome';
import SignupForm from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <Welcome />;
  }
  
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <Card className="w-full max-w-sm mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Regístrate</CardTitle>
          <CardDescription>
            Crea una cuenta para empezar a reservar clases.
          </CardDescription>
        </CardHeader>
        <SignupForm />
      </Card>
    </div>
  );
}
