
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee, UserProfile } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2, Trash2, Pencil, UserPlus } from 'lucide-react';
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
import AdminBookingModal from './admin-booking-modal';
import { useAuth } from '@/hooks/use-auth';

const anton = Anton({
  subsets: ['latin'],
  weight: '400'
});

interface ClassListItemProps {
  classInfo: ClassInfo;
  user: User | null;
  isBookedByUser: boolean;
  onBookingUpdate: (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string, attendeeToUpdate?: Attendee) => Promise<void>;
  changingBooking: { classId: string, attendee: Attendee } | null;
  setChangingBooking: (booking: { classId: string, attendee: Attendee } | null) => void;
}

export default function ClassListItem({ classInfo, user, isBookedByUser, onBookingUpdate, changingBooking, setChangingBooking }: ClassListItemProps) {
  const { isSuperAdmin } = useAuth();
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [attendeeToRemove, setAttendeeToRemove] = useState<Attendee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBookClass = async (selectedUser?: UserProfile) => {
    if (!user) return;

    if (isSuperAdmin && !selectedUser && !changingBooking) {
      setIsModalOpen(true);
      return;
    }
    
    setIsBooking(true);
    
    const isBookingForOther = isSuperAdmin && selectedUser;
    const userForBooking = isBookingForOther ? selectedUser : user;
    const displayName = isBookingForOther ? selectedUser.name : user.displayName;
    
    const newAttendee: Attendee = {
      uid: userForBooking.uid,
      name: displayName || userForBooking.email?.split('@')[0] || "Usuario",
      ...(isBookingForOther && selectedUser.photoURL && { photoURL: selectedUser.photoURL }),
      ...(!isBookingForOther && userForBooking.photoURL && { photoURL: userForBooking.photoURL }),
    };

    const oldClassId = changingBooking?.classId;
    const attendeeToUpdate = changingBooking?.attendee;
    
    await onBookingUpdate(classInfo, newAttendee, oldClassId, attendeeToUpdate);
    setIsBooking(false);
    setIsModalOpen(false);
  };

  const handleCancelBooking = async () => {
    if (!user) return;
    setIsCancelling(true);

    const attendeeData: Attendee = {
        uid: user.uid,
        name: user.displayName || 'Usuario',
        ...(user.photoURL && { photoURL: user.photoURL })
    };

    await onBookingUpdate(classInfo, null, undefined, attendeeData);
    setIsCancelling(false);
    setShowCancelConfirm(false);
  };

  const handleAdminRemoveBooking = async () => {
    if (!user || !isSuperAdmin || !attendeeToRemove) return;
    setIsCancelling(true);
    await onBookingUpdate(classInfo, null, undefined, attendeeToRemove);
    setIsCancelling(false);
    setAttendeeToRemove(null);
  }
  
  const handleStartChange = (attendee: Attendee) => {
      setChangingBooking({ classId: classInfo.id, attendee });
  };

  const renderAttendees = () => {
    const totalSlots = Array.from({ length: classInfo.capacity });
    return totalSlots.map((_, index) => {
      const attendee = classInfo.attendees[index];
      if (attendee) {
        return (
          <div key={attendee.uid} className="relative group flex flex-col items-center text-center">
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
             {isSuperAdmin && (
              <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => handleStartChange(attendee)}
                    className="bg-secondary text-secondary-foreground rounded-full p-1 shadow-md"
                    aria-label={`Modificar a ${attendee.name}`}
                >
                    <Pencil className="h-3 w-3" />
                </button>
                <button 
                    onClick={() => setAttendeeToRemove(attendee)}
                    className="bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                    aria-label={`Eliminar a ${attendee.name}`}
                >
                    <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
            <span className="text-xs mt-1 truncate w-12">{attendee.name}</span>
          </div>
        );
      }
      // Empty Slot rendering
      if (isSuperAdmin) {
        return (
            <button 
                key={index} 
                onClick={() => handleBookClass()} 
                className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-accent hover:text-accent-foreground transition-colors group"
                aria-label="Añadir cliente"
            >
                <UserPlus className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </button>
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
    const isChangingThisClass = changingBooking?.classId === classInfo.id;
    const isCurrentUserBeingChanged = isBookedByUser && isChangingThisClass;
    const isOtherUserBeingChanged = !!changingBooking && changingBooking.attendee.uid !== user?.uid;

    if (changingBooking && !isChangingThisClass) {
        if(isFull) return <Button disabled>Completo</Button>;
        return (
            <div className="flex items-center gap-2">
                <Button onClick={() => handleBookClass()}>
                    {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Moviendo...</> : "Mover aquí"}
                </Button>
            </div>
        )
    }

    if (isBookedByUser) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full md:w-auto">
            <Button 
                onClick={isCurrentUserBeingChanged ? () => setChangingBooking(null) : () => handleStartChange({ uid: user!.uid, name: user!.displayName || 'user', photoURL: user!.photoURL || undefined })} 
                variant={isCurrentUserBeingChanged ? "ghost" : "default"} 
                disabled={isBooking || isCancelling || (!!changingBooking && !isCurrentUserBeingChanged)} className="md:w-32"
            >
                {isCurrentUserBeingChanged ? "Cancelar cambio" : "Cambiar"}
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={isBooking || isCancelling || !!changingBooking}>
                Cancelar
            </Button>
        </div>
      );
    }
    
    if (isSuperAdmin && isOtherUserBeingChanged) {
        if (isFull) {
            return <Button disabled>Completo</Button>;
        }
        return (
            <Button onClick={() => handleBookClass()} disabled={isBooking}>
                {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Moviendo...</> : "Mover aquí"}
            </Button>
        );
    }


    if (isFull) {
      return <Button disabled>Completo</Button>;
    }

    if(isSuperAdmin) {
        // Admin sees no general "Book" button, they should click on empty slots.
        return null;
    }

    return (
      <Button onClick={() => handleBookClass()} disabled={isBooking || !!changingBooking}>
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

      <AlertDialog open={!!attendeeToRemove} onOpenChange={(open) => !open && setAttendeeToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación (Admin)</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la reserva de <strong>{attendeeToRemove?.name}</strong> de la clase {classInfo.name} a las {classInfo.time}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} onClick={() => setAttendeeToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminRemoveBooking} disabled={isCancelling} className={buttonVariants({ variant: "destructive" })}>
               {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Sí, Eliminar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isSuperAdmin && (
        <AdminBookingModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleBookClass}
        />
      )}
    </>
  );
}
