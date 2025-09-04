
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let emailToLogin = identifier;

      // Check if identifier is a phone number
      if (!identifier.includes('@')) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phoneNumber", "==", identifier));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          emailToLogin = userDoc.data().email;
        } else {
           throw new Error("No se ha encontrado ninguna cuenta con este teléfono o correo electrónico.");
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const correctName = userData.name;
        if (user.displayName !== correctName) {
          await updateProfile(user, { displayName: correctName });
        }
      } else {
        console.warn("No user document found in Firestore for this user.");
      }

      router.push("/");
    } catch (error: any) {
      let description = "Por favor, comprueba tus credenciales e inténtalo de nuevo.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-api-key') {
        description = "Credenciales incorrectas. Por favor, inténtalo de nuevo.";
      } else if (error.code === 'auth/user-not-found' || error.message.includes("No se ha encontrado")) {
        description = "No se ha encontrado ninguna cuenta con este teléfono o correo electrónico.";
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
    <form onSubmit={handleLogin}>
      <CardContent className="grid gap-4 pt-6">
        <div className="grid gap-2">
          <Label htmlFor="identifier">Correo Electrónico o Teléfono</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="tu@correo.com o tu teléfono"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
            className="bg-secondary"
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
  );
}
