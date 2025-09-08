
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center p-4 h-full">
       <Card className="w-full max-w-sm mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
            <CardDescription>
              Introduce tu correo y contraseña para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
    </div>
  );
}
