
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile, type ConfirmationResult } from "firebase/auth";
import { doc, getDoc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
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
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const router = useRouter();
  const { toast } = useToast();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recaptchaContainerRef.current) {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
        });
        window.recaptchaVerifier = verifier;

        // Cleanup
        return () => {
            verifier.clear();
        };
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        if (!window.recaptchaVerifier) {
            throw new Error("reCAPTCHA verifier not initialized.");
        }
        
        const confirmationResult = await signInWithPhoneNumber(auth, `+${phoneNumber}`, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        
        toast({
            title: "Código enviado",
            description: "Hemos enviado un código de verificación a tu teléfono.",
        });
        setStep("otp");

    } catch (error: any) {
        console.error("Error sending OTP:", error);
        let description = "No se pudo enviar el código. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/invalid-phone-number') {
            description = "El número de teléfono no es válido.";
        }
        toast({
            variant: "destructive",
            title: "Error",
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
        if (!window.confirmationResult) {
            throw new Error("No confirmation result found.");
        }
        const userCredential = await window.confirmationResult.confirm(otp);
        const user = userCredential.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User exists, log them in and redirect
             if (user.displayName !== userDoc.data().name) {
                await updateProfile(user, { displayName: userDoc.data().name });
             }
            router.push("/");
        } else {
            // New user, ask for their name
            setStep("name");
        }
        
    } catch (error: any) {
         console.error("Error verifying OTP:", error);
        toast({
            variant: "destructive",
            title: "Error de verificación",
            description: "El código no es válido o ha expirado. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCreateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      const user = auth.currentUser;
      if (!user || !name) {
          setIsLoading(false);
          return;
      }
      
      try {
          // Check for existing username
        const usersRef = collection(db, "users");
        const nameQuery = query(usersRef, where("name", "==", name));
        const nameQuerySnapshot = await getDocs(nameQuery);
        if (!nameQuerySnapshot.empty) {
            throw new Error("El nombre de usuario ya existe.");
        }

        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email: null,
            phoneNumber: user.phoneNumber,
            createdAt: new Date(),
        });
        router.push("/");
      } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error al crear perfil",
            description: error.message || "No se pudo guardar tu nombre. Por favor, inténtalo de nuevo.",
          });
      } finally {
          setIsLoading(false);
      }
  };


  return (
    <div className="pt-6">
      <div ref={recaptchaContainerRef}></div>
      {step === "phone" && (
        <form onSubmit={handleSendOtp}>
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="34600000000"
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
              Enviar Código
            </Button>
          </CardFooter>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-2">
              <Label htmlFor="otp">Código de Verificación</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                className="bg-secondary"
                maxLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-0 pt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar y Continuar
            </Button>
            <Button variant="link" size="sm" onClick={() => setStep("phone")} disabled={isLoading}>
                Usar otro número
            </Button>
          </CardFooter>
        </form>
      )}
      
      {step === "name" && (
         <form onSubmit={handleCreateProfile}>
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-2">
              <Label htmlFor="name">¡Bienvenido! Elige tu nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre de usuario"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-secondary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-0 pt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar y Entrar
            </Button>
          </CardFooter>
        </form>
      )}
    </div>
  );
}
