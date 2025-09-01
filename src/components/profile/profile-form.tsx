
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

const profileFormSchema = z.object({
  dob: z.date().optional(),
  bio: z.string().max(200, "La biografía no puede exceder los 200 caracteres.").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bio: "",
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // Convert Firestore Timestamp to JS Date if it exists
        if (data.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate();
        }

        setProfile(data);
        form.reset({
          bio: data.bio || "",
          dob: data.dob,
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, router, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        bio: data.bio,
        dob: data.dob,
      });
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada con éxito.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu perfil. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-card rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user?.uid}`} />
            <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profile?.name}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Tu fecha de nacimiento no será pública.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos un poco sobre ti..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Un breve resumen sobre ti.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Dummy Card components for structure, assuming they exist in ui/card
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>;
const CardDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;
const CardFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>;
