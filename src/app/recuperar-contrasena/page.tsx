
"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo Enviado",
        description: "Si tu correo está registrado, recibirás un enlace para recuperar tu contraseña.",
      });
    } catch (error: any) {
      let description = "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
      if (error.code === 'auth/invalid-email') {
        description = "El formato del correo electrónico no es válido.";
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 h-full">
      <Card className="w-full max-w-sm mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Recupera tu Contraseña</CardTitle>
          <CardDescription>
            Introduce tu correo y te enviaremos un enlace para restablecerla.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-secondary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Correo de Recuperación
            </Button>
            <Button variant="link" asChild>
                <Link href="/login">Volver a Iniciar Sesión</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
