"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";

const motivationalMessages = [
    {
        title: "¡Dale vida a tu perfil!",
        description: "Una foto ayuda a que los entrenadores y compañeros te reconozcan. ¡Es un paso rápido para sentirte parte de la comunidad!",
    },
    {
        title: "¡Muestra tu mejor cara!",
        description: "Personaliza tu perfil con una foto. ¡Conectarás mejor con el resto de usuarios!",
    },
    {
        title: "Un perfil completo",
        description: "Los perfiles con foto son más reconocibles en las clases. ¡No te quedes atrás!",
    },
    {
        title: "¡Conéctate con Sport ON!",
        description: "Añadir una foto es el primer paso para sentirte parte del equipo.",
    }
];

export default function PhotoMotivationModal() {
    const showModal = useUserStore((state) => state.showPhotoMotivationModal);
    const setShowModal = useUserStore((state) => state.setShowPhotoMotivationModal);
    const router = useRouter();
    const [message, setMessage] = useState(motivationalMessages[0]);

    useEffect(() => {
        if (showModal) {
            // Pick a random message when the modal is shown
            setMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
        }
    }, [showModal]);

    const handleGoToProfile = () => {
        setShowModal(false);
        router.push("/profile");
    };
    
    const handleClose = (open: boolean) => {
        if (!open) {
            setShowModal(false);
        }
    }

    return (
        <Dialog open={showModal} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="text-center items-center">
                    <div className="bg-primary/10 p-3 rounded-full w-fit">
                        <ImagePlus className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold pt-2">{message.title}</DialogTitle>
                    <DialogDescription>
                        {message.description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={handleGoToProfile}>Añadir Foto de Perfil</Button>
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Ahora no</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
