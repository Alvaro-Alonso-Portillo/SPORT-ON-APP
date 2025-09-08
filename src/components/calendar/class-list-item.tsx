
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
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
import { isBefore, parse } from 'date-fns';
import { Anton } from 'next/font/google';
import { cn, generateColorFromUID, getInitials } from '@/lib/utils';
import UserProfileModal from '@/components/profile/user-profile-modal';

const anton = Anton({
  subsets: ['latin'],
  weight: '400'
});

interface ClassListItemProps {
  classInfo: ClassInfo;
  user: User | null;
  isBookedByUser: boolean;
  onBookingUpdate: (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string) => Promise<void>;
  changingBookingId: string | null;
  setChangingBookingId: (id: string | null) => void;
}

export default function ClassListItem({ classInfo, user, isBookedByUser, onBookingUpdate, changingBookingId, setChangingBookingId }: ClassListItemProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  const handleBookClass = async () => {
    if (!user) return;
    setIsBooking(true);
    const newAttendee: Attendee = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || "Usuario",
      photoURL: user.photoURL || undefined
    };
    
    const oldClassId = changingBookingId || undefined;
    
    await onBookingUpdate(classInfo, newAttendee, oldClassId);
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
  };

  const renderAttendees = () => {
    const totalSlots = Array.from({ length: classInfo.capacity });
    return totalSlots.map((_, index) => {
      const attendee = classInfo.attendees[index];
      if (attendee) {
        return (
          <div key={attendee.uid} className="flex flex-col items-center text-center">
            <button onClick={() => setSelectedAttendee(attendee)} className="rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-12 w-12 rounded-md">
                <AvatarImage src={attendee.photoURL} alt={attendee.name} />
                <AvatarFallback 
                    className="rounded-md text-white font-bold"
                    style={{ backgroundColor: generateColorFromUID(attendee.uid) }}
                >
                    {getInitials(attendee.name)}
                </AvatarFallback>
                </Avatar>
            </button>
            <span className="text-xs mt-1 truncate w-12">{attendee.name}</span>
          </div>
        );
      }
      return <div key={index} className="h-12 w-12 bg-muted rounded-md" />;
    });
  };
  
  const classDateTime = parse(`${classInfo.date} ${classInfo.time}`, 'yyyy-MM-dd HH:mm', new Date());
  const isPastClass = isBefore(classDateTime, new Date());

  const renderButton = () => {
    if(isPastClass) {
        return <Button disabled>Finalizada</Button>;
    }
    
    const isFull = classInfo.attendees.length >= classInfo.capacity;
    const isChangingThis = changingBookingId === classInfo.id;
    
    if (changingBookingId && !isChangingThis) {
        if(isBookedByUser || isFull) return <Button disabled>No disponible</Button>;
        return (
            <div className="flex items-center gap-2">
                <Button onClick={handleBookClass}>
                    {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Moviendo...</> : "Mover aquí"}
                </Button>
            </div>
        )
    }

    if (isBookedByUser) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full md:w-auto">
            <Button onClick={isChangingThis ? () => setChangingBookingId(null) : handleStartChange} variant={isChangingThis ? "ghost" : "default"} disabled={isBooking || isCancelling || (!!changingBookingId && !isChangingThis)} className="md:w-32">
                {isChangingThis ? "Cancelar cambio" : "Cambiar"}
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={isBooking || isCancelling || !!changingBookingId}>
                Cancelar
            </Button>
        </div>
      );
    }

    if (isFull) {
      return <Button disabled>Completo</Button>;
    }

    return (
      <Button onClick={handleBookClass} disabled={isBooking || !!changingBookingId}>
        {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</> : "Reservar"}
      </Button>
    );
  };

  return (
    <>
      <div id={`class-${classInfo.time.replace(':', '')}`} className="w-full bg-card p-4 rounded-lg shadow-sm border-t-4 border-primary overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className={cn(anton.className, "text-2xl md:text-3xl text-foreground uppercase")}>{classInfo.name}</h3>
            <span className="text-lg font-bold text-foreground">{classInfo.time}</span>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-2 my-4 -mx-4 px-4">
            {renderAttendees()}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
            </div>
            {renderButton()}
        </div>

      </div>

      <UserProfileModal 
        attendee={selectedAttendee}
        isOpen={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
      />
      
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
