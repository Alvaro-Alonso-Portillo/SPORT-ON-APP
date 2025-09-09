
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp, collection, writeBatch, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { useUserStore } from "@/store/user-store";

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
import type { UserProfile, ClassInfo } from "@/types";
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

interface ProfileFormProps {
  userBookings: string[];
}

export default function ProfileForm({ userBookings }: ProfileFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { setUserProfile } = useUserStore();
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
  });
  
  useEffect(() => {
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
  
  const updateUserPhotoInBookings = async (userId: string, newPhotoURL: string | null) => {
    if (!userProfile || userBookings.length === 0) return;

    const batch = writeBatch(db);
    
    for (const classId of userBookings) {
        const classDocRef = doc(db, "classes", classId);
        // We need to get the current attendees array to update it correctly.
        // This is a limitation of batching array updates without transactions.
        const classDoc = await getDoc(classDocRef);
        if (classDoc.exists()) {
            const classData = classDoc.data() as ClassInfo;
            const updatedAttendees = classData.attendees.map(attendee => {
                if (attendee.uid === userId) {
                    return { ...attendee, photoURL: newPhotoURL || undefined };
                }
                return attendee;
            });
            batch.update(classDocRef, { attendees: updatedAttendees });
        }
    }
    await batch.commit();
  };
  
  const handleDeletePhoto = async () => {
    if (!user || !userProfile || !userProfile.photoURL) return;
    setIsSubmitting(true);
    try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}/profile.jpg`);
        await deleteObject(storageRef).catch(error => {
            // Ignore not found error, as the DB is the source of truth
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        });

        // Update photo in existing bookings to null
        await updateUserPhotoInBookings(user.uid, null);
        
        // Update user profile in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { photoURL: null });
        
        const updatedProfile = { ...userProfile, photoURL: undefined };
        setUserProfile(updatedProfile as UserProfile);

        toast({
            title: "Foto eliminada",
            description: "Tu foto de perfil ha sido eliminada.",
        });

    } catch (error: any) {
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
      let newPhotoURL = userProfile.photoURL;
      const updateData: Partial<UserProfile> = {};

      // Handle photo upload and update
      if (croppedImage) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, croppedImage, { contentType: 'image/jpeg' });
        newPhotoURL = await getDownloadURL(snapshot.ref);
        updateData.photoURL = newPhotoURL;
        
        // Now, update the photo in all bookings
        if (newPhotoURL) {
            await updateUserPhotoInBookings(user.uid, newPhotoURL);
        }
      }
      
      // Handle date of birth update
      const profileDobString = userProfile.dob ? format((userProfile.dob instanceof Timestamp ? userProfile.dob.toDate() : new Date(userProfile.dob)), "yyyy-MM-dd") : '';
      if (data.dob !== profileDobString) {
        if (data.dob) {
          updateData.dob = Timestamp.fromDate(new Date(data.dob.replace(/-/g, '/')));
        } else {
          updateData.dob = null;
        }
      }
      
      // Commit all changes to the user's profile document
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        const updatedProfile = { ...userProfile, ...updateData, photoURL: newPhotoURL || userProfile.photoURL };
        setUserProfile(updatedProfile as UserProfile);
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
  const avatarUser = { ...userProfile, photoURL: currentAvatarURL };

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start gap-4">
              <UserAvatar user={avatarUser} className="h-20 w-20 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
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
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <FormLabel>Imagen del perfil</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                         <FormDescription>
                           Sube una foto de perfil (JPG o PNG).
                         </FormDescription>
                      </div>
                      {userProfile?.photoURL && (
                        <Button type="button" variant="destructive" size="icon" onClick={handleDeletePhoto} disabled={isSubmitting}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                onValueChange={(value) => setZoom(value[0])}
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
