
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name || !email || !password) {
        toast({
            variant: "destructive",
            title: "Fallo de registro",
            description: "Por favor, completa todos los campos.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error("El nombre de usuario ya existe.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        createdAt: new Date(),
      });
      
      router.push("/");

    } catch (error: any) {
        let description = error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Este correo electrónico ya está en uso.";
        } else if (error.code === 'auth/weak-password') {
            description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
        } else if (error.code === 'auth/invalid-email') {
            description = "El formato del correo electrónico no es válido.";
        } else if (error.code === 'auth/invalid-api-key') {
            description = "Error de configuración. Por favor, contacta con el administrador.";
        }
        
      toast({
        variant: "destructive",
        title: "Fallo de registro",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Regístrate</CardTitle>
        <CardDescription>
          Crea una cuenta para empezar a reservar clases.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="grid gap-4">
           <div className="grid gap-2">
            <Label htmlFor="name">Nombre de Usuario</Label>
            <Input
              id="name"
              type="text"
              placeholder="Elige un nombre de usuario"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="bg-secondary"
            />
          </div>
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
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Debe tener al menos 6 caracteres"
              className="bg-secondary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
          </Button>
          <div className="text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline text-primary">
              Iniciar Sesión
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
