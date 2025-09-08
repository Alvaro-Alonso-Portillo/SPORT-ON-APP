
"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
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
import { generateColorFromUID, getInitials } from "@/lib/utils";

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
      setImageSrc(null); // Clear the source to prevent re-opening modal on submit
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
      form.setValue('profileImage', null); // Reset file input using react-hook-form
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      let photoURL = profile?.photoURL;
      const updateData: Partial<UserProfile> = {};

      // Handle file upload with cropped image
      if (croppedImage) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, croppedImage, { contentType: 'image/jpeg' });
        photoURL = await getDownloadURL(snapshot.ref);
        updateData.photoURL = photoURL;
        
        await updateProfile(auth.currentUser, { photoURL });
        await auth.currentUser.reload();
      }
      
      // Handle date of birth
      const profileDobString = profile?.dob ? format((profile.dob instanceof Timestamp ? profile.dob.toDate() : new Date(profile.dob)), "yyyy-MM-dd") : '';
      if (data.dob !== profileDobString) {
        if (data.dob) {
          updateData.dob = Timestamp.fromDate(new Date(data.dob.replace(/-/g, '/')));
        } else {
          // Explicitly set to null if the date is cleared
          updateData.dob = null;
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        setProfile(prev => prev ? { ...prev, ...updateData, photoURL: photoURL || prev.photoURL } : null);
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
      setCroppedImage(null);
      form.setValue('profileImage', null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-card rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentAvatar = croppedImage ? URL.createObjectURL(croppedImage) : auth.currentUser?.photoURL || profile?.photoURL;
  const userName = profile?.name || user?.displayName || "Usuario";

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 flex-shrink-0">
                <AvatarImage src={currentAvatar} />
                <AvatarFallback 
                  className="text-white font-bold text-2xl"
                  style={{ backgroundColor: generateColorFromUID(user?.uid || '') }}
                >
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{userName}</CardTitle>
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
                    <FormLabel>Imagen del perfil</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
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
