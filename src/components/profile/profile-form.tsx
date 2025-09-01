
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const profileFormSchema = z.object({
  dob: z.string().optional(),
  profileImage: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const motivationalQuotes = [
  "La disciplina es el puente entre las metas y los logros.",
  "Tu único límite es tu mente.",
  "No te detengas hasta que te sientas orgulloso.",
  "El dolor que sientes hoy será la fuerza que sentirás mañana.",
  "Cada entrenamiento cuenta.",
  "Cree en ti mismo y todo lo que eres. Sé consciente de que hay algo en tu interior que es más grande que cualquier obstáculo.",
];

export default function ProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quote, setQuote] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });
  
  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

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
        let dobString = "";
        
        if (data.dob) {
          const dobDate = data.dob instanceof Timestamp ? data.dob.toDate() : new Date(data.dob);
          dobString = format(dobDate, "yyyy-MM-dd");
        }
        
        setProfile(data);
        form.reset({
          dob: dobString,
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, router, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      let photoURL = profile?.photoURL;
      const updateData: Partial<UserProfile> = {};

      // Handle file upload
      if (data.profileImage && data.profileImage.length > 0) {
        const file = data.profileImage[0];
        const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(snapshot.ref);
        updateData.photoURL = photoURL;
        
        await updateProfile(auth.currentUser, { photoURL });
        await auth.currentUser.reload(); // Force reload to update user object across the app
      }
      
      // Handle date of birth
      if (data.dob) {
        updateData.dob = Timestamp.fromDate(new Date(data.dob.replace(/-/g, '/')));
      } else if (data.dob === '') {
        updateData.dob = undefined;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        setProfile(prev => prev ? { ...prev, ...updateData } : null);
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada con éxito.",
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu perfil. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
      form.reset(form.getValues());
      setImagePreview(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-card rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentAvatar = imagePreview || auth.currentUser?.photoURL || profile?.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user?.uid}`;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 flex-shrink-0">
            <AvatarImage src={currentAvatar} />
            <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{profile?.name || user?.displayName}</CardTitle>
            <CardDescription>{profile?.email || user?.email}</CardDescription>
             {quote && (
              <div className="mt-4 p-3 border-l-4 border-primary bg-accent rounded-r-lg">
                <p className="text-sm italic text-accent-foreground">
                  "{quote}"
                </p>
              </div>
            )}
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
                <FormItem>
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Tu fecha de nacimiento no será pública.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagen del perfil</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg"
                      {...rest}
                      onChange={(e) => {
                        const files = e.target.files;
                        onChange(files);
                         if (files && files[0]) {
                           setImagePreview(URL.createObjectURL(files[0]));
                         } else {
                           setImagePreview(null);
                         }
                      }}
                    />
                  </FormControl>
                   <FormDescription>
                    Sube una foto de perfil (JPG o PNG).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
