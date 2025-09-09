
"use client";

import LoginForm from "@/components/auth/login-form";
import PhoneAuthForm from "@/components/auth/phone-auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
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
                <TabsTrigger value="email">Correo</TabsTrigger>
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
