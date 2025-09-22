
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db, storage, auth } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

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
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import type { UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import UserAvatar from "../ui/user-avatar";

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "El nombre no puede estar vacío." }),
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
  const { user, userProfile, loading: authLoading, fetchUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState("");

  // States for image cropping
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
        name: "",
        dob: "",
    },
  });
  
  useEffect(() => {
    // Generate random quote only on the client-side after mount to avoid hydration errors
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (userProfile) {
        let dobString = "";
        if (userProfile.dob) {
          const dobDate = userProfile.dob instanceof Timestamp ? userProfile.dob.toDate() : new Date(userProfile.dob);
          dobString = format(dobDate, "yyyy-MM-dd");
        }
        form.reset({
          name: userProfile.name || "",
          dob: dobString,
        });
    }
  }, [userProfile, form]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedImageBlob);
      setIsCropping(false);
      setImageSrc(null);
      toast({
          title: "Imagen Recortada",
          description: "La nueva imagen está lista para ser guardada. Haz clic en 'Guardar Cambios' para subirla.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error de Recorte",
        description: "No se pudo recortar la imagen.",
      });
    }
  }, [imageSrc, croppedAreaPixels, toast]);

  const onCropCancel = () => {
      setIsCropping(false);
      setImageSrc(null);
      form.setValue('profileImage', null);
  };
  
  const handleDeletePhoto = async () => {
    if (!user || !auth.currentUser || !userProfile || !userProfile.photoURL) return;
    setIsSubmitting(true);
    try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}/profile.jpg`);
        await deleteObject(storageRef).catch(error => {
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        });

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { photoURL: null });
        await updateProfile(auth.currentUser, { photoURL: "" });

        // Force a re-fetch of the profile from the store
        await fetchUserProfile(user.uid);
        
        toast({
            title: "Foto eliminada",
            description: "Tu foto de perfil ha sido eliminada.",
        });

    } catch (error: any) {
         console.error("Error detallado al eliminar perfil:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar tu foto. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  async function onSubmit(data: ProfileFormValues) {
    if (!user || !auth.currentUser || !userProfile) return;
    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updateData: Partial<UserProfile> = {};
      let newPhotoURL: string | null = userProfile.photoURL || null;

      // Handle name update
      if (data.name !== userProfile.name) {
          updateData.name = data.name;
      }
      
      // Handle photo upload
      if (croppedImage) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, croppedImage, { contentType: 'image/jpeg' });
        newPhotoURL = await getDownloadURL(snapshot.ref);
        updateData.photoURL = newPhotoURL;
      }
      
      // Handle date of birth update
      const profileDobString = userProfile.dob ? format((userProfile.dob instanceof Timestamp ? userProfile.dob.toDate() : new Date(userProfile.dob)), "yyyy-MM-dd") : '';
      if (data.dob !== profileDobString) {
        updateData.dob = data.dob ? Timestamp.fromDate(new Date(data.dob.replace(/-/g, '/'))) : null;
      }
      
      // Update Firestore document
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
      }
      
      // Update Firebase Auth profile if name or photo changed
      const authProfileUpdates: { displayName?: string, photoURL?: string | null } = {};
      if (data.name !== user.displayName) {
          authProfileUpdates.displayName = data.name;
      }
      if (newPhotoURL !== user.photoURL) {
         authProfileUpdates.photoURL = newPhotoURL;
      }
      if (Object.keys(authProfileUpdates).length > 0) {
          await updateProfile(auth.currentUser, authProfileUpdates);
      }

      // Force a re-fetch of the profile from the store to update UI everywhere
      await fetchUserProfile(user.uid);

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada con éxito.",
      });

    } catch (error) {
      console.error("Error detallado al actualizar perfil:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu perfil. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
      setCroppedImage(null);
      form.setValue('profileImage', null);
    }
  }

  if (authLoading || !userProfile) {
    return (
      <div className="flex justify-center items-center h-48 bg-card rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentAvatarURL = croppedImage ? URL.createObjectURL(croppedImage) : userProfile.photoURL;
  const avatarUser = { ...userProfile, photoURL: currentAvatarURL, name: form.watch('name') };

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start gap-4">
              <UserAvatar user={avatarUser} className="h-20 w-20 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <CardTitle className="text-2xl">{form.watch('name')}</CardTitle>
                <CardDescription>{userProfile.email}</CardDescription>
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
          
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre de usuario" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este será el nombre que se muestre en la aplicación.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del perfil</FormLabel>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </div>
                      {userProfile?.photoURL && (
                        <Button type="button" variant="destructive" size="icon" onClick={handleDeletePhoto} disabled={isSubmitting}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
        </Card>
      </form>
      
      <Dialog open={isCropping} onOpenChange={(open) => !open && onCropCancel()}>
        <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Recortar Imagen</DialogTitle>
            <DialogDescription>
              Ajusta tu foto de perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex-1">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Label>Zoom</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValue-change={(value) => setZoom(value[0])}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onCropCancel}>Cancelar</Button>
              <Button onClick={showCroppedImage}>Recortar y Guardar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

    