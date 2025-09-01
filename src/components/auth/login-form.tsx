
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Find user by name to get their email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Usuario no encontrado");
      }

      const userData = querySnapshot.docs[0].data();
      const email = userData.email;
      const correctName = userData.name;

      if (!email) {
        throw new Error("Email not found for this user");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync the displayName from Firestore to Auth profile
      if (userCredential.user && !userCredential.user.displayName) {
        await updateProfile(userCredential.user, { displayName: correctName });
      }

      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fallo de inicio de sesión",
        description: error.message || "Por favor, comprueba tu nombre y contraseña e inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
        <CardDescription>
          Introduce tu nombre de usuario para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre de Usuario</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu Nombre"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="underline text-primary">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
