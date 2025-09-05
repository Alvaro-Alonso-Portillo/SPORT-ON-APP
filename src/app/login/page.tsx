
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from "@/components/auth/login-form";
import Welcome from '@/components/layout/welcome';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneAuthForm from '@/components/auth/phone-auth-form';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return <Welcome />
  }

  return (
    <div className="flex items-center justify-center p-4 h-full">
       <Card className="w-full max-w-sm mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
            <CardDescription>
              Elige un método para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Teléfono</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <LoginForm />
              </TabsContent>
              <TabsContent value="phone">
                <PhoneAuthForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
    </div>
  );
}
