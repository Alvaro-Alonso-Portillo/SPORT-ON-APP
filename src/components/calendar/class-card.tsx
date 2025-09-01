
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Calendar, Clock, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  onBack: () => void;
  isBookedByUser: boolean;
  onBookingUpdate: (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string) => Promise<void>;
  changingBookingId: string | null;
  setChangingBookingId: (id: string | null) => void;
}

export default function ClassCard({ classInfo, user, onBack, isBookedByUser, onBookingUpdate, changingBookingId, setChangingBookingId }: ClassCardProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formattedDate = format(new Date(classInfo.date.replace(/-/g, '/')), "eeee, d 'de' MMMM", { locale: es });

  const handleBookClass = async () => {
    if (!user) return;
    setIsBooking(true);
    const newAttendee: Attendee = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || "Usuario",
      photoURL: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
    };
    await onBookingUpdate(classInfo, newAttendee);
    setIsBooking(false);
  };

  const handleCancelBooking = async () => {
    if (!user) return;
    setIsCancelling(true);
    await onBookingUpdate(classInfo, null);
    setIsCancelling(false);
    setShowCancelConfirm(false);
  };
  
  const handleStartChange = () => {
      setChangingBookingId(classInfo.id);
      onBack();
  };

  const renderAttendees = () => {
    const totalSlots = Array.from({ length: classInfo.capacity });
    return totalSlots.map((_, index) => {
      const attendee = classInfo.attendees[index];
      if (attendee) {
        return (
          <Avatar key={attendee.uid} className="h-8 w-8 rounded-md">
            <AvatarImage src={attendee.photoURL} alt={attendee.name} />
            <AvatarFallback className="rounded-md">{attendee.name.charAt(0)}</AvatarFallback>
          </Avatar>
        );
      }
      return <div key={index} className="h-8 w-8 bg-muted rounded-md" />;
    });
  };

  const renderButton = () => {
    const isFull = classInfo.attendees.length >= classInfo.capacity;

    if (isBookedByUser) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <Button onClick={handleStartChange} disabled={isBooking}>
                {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cambiando...</> : "Cambiar Reserva"}
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={isBooking}>
                Cancelar
            </Button>
        </div>
      );
    }

    if (isFull) {
      return <Button disabled>Clase Completa</Button>;
    }

    return (
      <Button onClick={handleBookClass} disabled={isBooking} className="w-full">
        {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</> : "Reservar esta hora"}
      </Button>
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-headline">{classInfo.name}</CardTitle>
              <CardDescription className="capitalize">{formattedDate}</CardDescription>
            </div>
          </div>
          <div className="flex items-center justify-around text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{classInfo.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Plazas Ocupadas:</p>
          <div className="grid grid-cols-6 gap-2">
            {renderAttendees()}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          {renderButton()}
        </CardFooter>
      </Card>
      
       <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cancelará permanentemente tu reserva para {classInfo.name} a las {classInfo.time}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling}>
               {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Sí, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
