
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2, Trash2 } from 'lucide-react';
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

interface ClassListItemProps {
  classInfo: ClassInfo;
  user: User | null;
  isBookedByUser: boolean;
  onBook: (classInfo: ClassInfo) => void;
  onCancel: (classInfo: ClassInfo) => void;
  onChange: (classInfo: ClassInfo) => void;
  changingBookingId: string | null;
}

export default function ClassListItem({
  classInfo,
  user,
  isBookedByUser,
  onBook,
  onCancel,
  onChange,
  changingBookingId,
}: ClassListItemProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleBook = async () => {
    setIsBooking(true);
    await onBook(classInfo);
    setIsBooking(false);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    await onCancel(classInfo);
    setIsCancelling(false);
    setShowCancelConfirm(false);
  };

  const handleChange = () => {
    onChange(classInfo);
  };

  const renderAttendees = () => {
    const totalSlots = Array.from({ length: classInfo.capacity });
    return totalSlots.map((_, index) => {
      const attendee = classInfo.attendees[index];
      if (attendee) {
        return (
          <div key={attendee.uid} className="flex flex-col items-center text-center">
            <Avatar className="h-10 w-10 rounded-md">
              <AvatarImage src={attendee.photoURL} alt={attendee.name} />
              <AvatarFallback className="rounded-md">{attendee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1 truncate w-12">{attendee.name}</span>
          </div>
        );
      }
      return <div key={index} className="h-10 w-10 bg-muted rounded-md" />;
    });
  };

  const renderButtons = () => {
    const isFull = classInfo.attendees.length >= classInfo.capacity;

    if (changingBookingId) {
       if (changingBookingId === classInfo.id) {
           return <Button disabled>Clase Actual</Button>;
       }
       if (isFull || isBookedByUser) {
           return <Button disabled>No disponible</Button>;
       }
       return (
          <Button onClick={handleBook} disabled={isBooking}>
             {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Moviendo...</> : "Mover aquí"}
          </Button>
       )
    }

    if (isBookedByUser) {
      return (
        <div className="flex items-center gap-2">
          <Button onClick={handleChange}>
            Cambiar
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setShowCancelConfirm(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (isFull) {
      return <Button disabled>Clase Completa</Button>;
    }

    return (
      <Button onClick={handleBook} disabled={isBooking}>
        {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</> : "Reservar"}
      </Button>
    );
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b-4 border-primary/80 flex justify-between items-center">
          <h3 className="font-headline text-lg font-bold">{classInfo.name}</h3>
          <span className="font-bold text-lg">{classInfo.time}</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 mb-4">
            {renderAttendees()}
          </div>
        </div>
        <div className="bg-secondary/50 p-4 flex justify-between items-center">
           <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
           </div>
           <div>
              {renderButtons()}
           </div>
        </div>
      </div>

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
            <AlertDialogAction onClick={handleConfirmCancel} disabled={isCancelling}>
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
