
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
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
            description: "Por favor, completa todos los campos requeridos.",
        });
        setIsLoading(false);
        return;
    }

    try {
      // 1. Create user in Firebase Auth FIRST. This establishes an authenticated session.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Now that the user is authenticated, we have permission to write to Firestore.
      // Update Auth profile
      await updateProfile(user, { displayName: name });

      // 3. Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        phoneNumber: phoneNumber || null,
        photoURL: null,
        createdAt: new Date(),
      });
      
      // 4. Redirect on success
      router.push("/dashboard");

    } catch (error: any) {
        console.error('Error de registro no capturado:', error);
        let description = "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = "Este correo ya está registrado. Por favor, inicia sesión.";
                break;
            case 'auth/weak-password':
                description = "La contraseña no es segura. Debe tener al menos 6 caracteres.";
                break;
            case 'auth/invalid-email':
                description = "El formato del correo electrónico no es válido.";
                break;
             case 'auth/invalid-api-key':
                description = "Error de configuración. Por favor, contacta con el administrador.";
                break;
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
      <form onSubmit={handleSignup} className="pt-6">
        <CardContent className="grid gap-4 p-0">
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
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Teléfono (Opcional)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="bg-secondary"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Debe tener al menos 6 caracteres"
                  className="bg-secondary pr-10"
                />
                 <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-0 pt-6">
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
  );
}
