
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, updateProfile, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Set session persistence based on "Remember me" checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful login, Firestore reads are permitted.
      // Sync displayName from Firestore to Auth if they differ.
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const correctName = userData.name;
        if (user.displayName !== correctName) {
          await updateProfile(user, { displayName: correctName });
        }
      } else {
        // This case is unlikely if signup is working correctly, but good to handle.
        console.warn("No user document found in Firestore for this user.");
      }

      router.push("/dashboard");
    } catch (error: any) {
      let description = "Por favor, comprueba tus credenciales e inténtalo de nuevo.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-api-key') {
        description = "Credenciales incorrectas. Por favor, inténtalo de nuevo.";
      } else if (error.code === 'auth/user-not-found') {
        description = "No se ha encontrado ninguna cuenta con este correo electrónico.";
      }

      toast({
        variant: "destructive",
        title: "Fallo de inicio de sesión",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleLogin} className="pt-6">
      <CardContent className="grid gap-4 p-0">
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-secondary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
         <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(Boolean(checked))} />
            <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                Recordarme
            </Label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-0 pt-6">
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
  );
}
