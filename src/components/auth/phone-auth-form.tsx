
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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

export default function PhoneAuthForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if ('recaptchaVerifier' in window && window.recaptchaVerifier) {
        // Cleanup previous instance if it exists
        window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    return () => {
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }
    }
  }, []);

  const onSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      toast({ variant: "destructive", title: "Error", description: "El verificador reCAPTCHA no está listo." });
      setIsLoading(false);
      return;
    }

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({ title: "Código enviado", description: "Revisa tus mensajes para encontrar el código de 6 dígitos." });
    } catch (error: any) {
      console.error(error);
      let description = "Ha ocurrido un error. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/invalid-phone-number') {
        description = "El número de teléfono no es válido. Asegúrate de incluir el prefijo internacional (ej. +34 para España).";
      } else if (error.code === 'auth/too-many-requests') {
          description = "Has intentado enviar demasiados códigos. Por favor, inténtalo más tarde."
      }
      toast({ variant: "destructive", title: "Error al enviar el código", description });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const confirmationResult = window.confirmationResult;
    if (!confirmationResult) {
      toast({ variant: "destructive", title: "Error", description: "No se encontró el resultado de la confirmación." });
      setIsLoading(false);
      return;
    }
    
    try {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;

        // Check if user exists in Firestore, if not create a new entry
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             const defaultName = `Usuario-${user.uid.substring(0, 5)}`;
             await setDoc(userDocRef, {
                uid: user.uid,
                name: defaultName,
                email: user.email, // Will be null for phone auth
                phoneNumber: user.phoneNumber,
                createdAt: new Date(),
            });
            // Update auth profile as well
            // Note: displayName update is tricky here without a name input, can be done in profile page
        }
        
        router.push("/");
    } catch (error: any) {
        console.error(error);
        let description = "Ha ocurrido un error. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/invalid-verification-code') {
            description = "El código de verificación no es válido. Por favor, inténtalo de nuevo."
        } else if (error.code === 'auth/code-expired') {
            description = "El código ha expirado. Por favor, solicita uno nuevo."
        }
        toast({ variant: "destructive", title: "Error de verificación", description });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <>
      <div id="recaptcha-container"></div>
      <form onSubmit={otpSent ? onVerifyOtp : onSignInSubmit}>
        <CardContent className="grid gap-4 pt-6">
          {!otpSent ? (
            <div className="grid gap-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                className="bg-secondary"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="otp">Código de Verificación</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                className="bg-secondary"
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {otpSent ? "Verificar y Continuar" : "Enviar Código SMS"}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
