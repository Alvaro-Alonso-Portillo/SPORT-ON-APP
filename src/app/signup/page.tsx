
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Welcome from '@/components/layout/welcome';
import SignupForm from "@/components/auth/signup-form";
import PhoneAuthForm from "@/components/auth/phone-auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            Elige un método para crear tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Correo</TabsTrigger>
                <TabsTrigger value="phone">Teléfono</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <SignupForm />
              </TabsContent>
              <TabsContent value="phone">
                <PhoneAuthForm isSignup={true} />
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
