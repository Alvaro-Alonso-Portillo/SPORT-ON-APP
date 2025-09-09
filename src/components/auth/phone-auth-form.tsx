
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, query, collection, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface PhoneAuthFormProps {
  isSignup?: boolean;
}

export default function PhoneAuthForm({ isSignup = false }: PhoneAuthFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isOtpSent) return;

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
       'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        toast({
            variant: "destructive",
            title: "Verificación expirada",
            description: "Por favor, intenta enviar el código de nuevo.",
        });
      }
    });
    
    // Render the reCAPTCHA explicitly
    window.recaptchaVerifier.render().catch((error) => {
        console.error("Error al renderizar reCAPTCHA:", error);
         toast({
            variant: "destructive",
            title: "Error de reCAPTCHA",
            description: "No se pudo iniciar la verificación. Por favor, recarga la página.",
        });
    });

    return () => {
      window.recaptchaVerifier?.clear();
    };
  }, [isOtpSent, toast]);


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignup && !name) {
        toast({
            variant: "destructive",
            title: "Fallo de registro",
            description: "Por favor, introduce tu nombre.",
        });
        setIsLoading(false);
        return;
    }
     if (isSignup) {
        // Check for existing username
        const usersRef = collection(db, "users");
        const nameQuery = query(usersRef, where("name", "==", name));
        const nameQuerySnapshot = await getDocs(nameQuery);
        if (!nameQuerySnapshot.empty) {
            toast({
                variant: "destructive",
                title: "Fallo de registro",
                description: "El nombre de usuario ya existe. Por favor, elige otro.",
            });
            setIsLoading(false);
            return;
        }
    }


    try {
      const appVerifier = window.recaptchaVerifier!;
      // Format number to E.164
      const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
      if (formattedPhoneNumber.length < 10) { // Basic validation
          throw new Error("Número de teléfono inválido.");
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({
        title: "Código enviado",
        description: "Hemos enviado un código de verificación a tu teléfono.",
      });

    } catch (error: any) {
      console.error("Error al enviar OTP:", error);
      let description = "No se pudo verificar. Por favor, desactiva cualquier bloqueador de anuncios y recarga la página.";
      if(error.code === 'auth/invalid-phone-number') {
        description = "El número de teléfono proporcionado no es válido."
      }
      toast({
        variant: "destructive",
        title: "Error al enviar código",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error("Por favor, solicita un nuevo código.");
      }
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() && isSignup) {
         await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email: null,
            phoneNumber: user.phoneNumber,
            photoURL: null,
            createdAt: new Date(),
          });
      } else if (!userDoc.exists() && !isSignup) {
          // User logged in but has no profile, force signup
          await auth.signOut();
          toast({
              variant: "destructive",
              title: "Cuenta no encontrada",
              description: "Este número no está registrado. Por favor, crea una cuenta.",
          });
          router.push('/signup');
          return;
      }
      
      router.push("/");

    } catch (error: any) {
      console.error("Error al verificar OTP:", error);
       let description = "Ocurrió un error inesperado. Inténtalo de nuevo.";
        if (error.code === 'auth/invalid-verification-code') {
            description = "El código de verificación no es válido. Por favor, inténtalo de nuevo.";
        } else if (error.code === 'auth/code-expired') {
            description = "El código ha expirado. Por favor, solicita uno nuevo.";
        }
      toast({
        variant: "destructive",
        title: "Fallo en la verificación",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const LinkComponent = isSignup 
    ? <Link href="/login" className="underline text-primary">Iniciar Sesión</Link>
    : <Link href="/signup" className="underline text-primary">Regístrate</Link>;

  const linkText = isSignup ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? ";

  if (isOtpSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="pt-6">
        <CardContent className="grid gap-4 p-0">
          <div className="grid gap-2">
            <Label htmlFor="otp">Código de Verificación</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Introduce el código de 6 dígitos"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
              className="bg-secondary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-0 pt-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar y Continuar
          </Button>
            <Button variant="link" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
                Reenviar código
            </Button>
        </CardFooter>
      </form>
    );
  }

  return (
      <form onSubmit={handleSendOtp} className="pt-6">
        <CardContent className="grid gap-4 p-0">
          {isSignup && (
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
          )}
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: 34612345678"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="bg-secondary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-0 pt-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignup ? "Enviar código" : "Iniciar Sesión"}
          </Button>
          <div className="text-center text-sm">
            {linkText}{" "}{LinkComponent}
          </div>
        </CardFooter>
        <div id="recaptcha-container" className="mt-4"></div>
      </form>
  );
}
