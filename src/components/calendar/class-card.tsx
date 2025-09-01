
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { Users, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';


interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string) => Promise<void>;
  dailyClasses: ClassInfo[];
  onTimeSelect: (time: string) => void;
  changingBookingId: string | null;
  setChangingBookingId: (id: string | null) => void;
}

export default function ClassCard({ 
  classInfo, 
  user, 
  userBookings, 
  onBookingUpdate, 
  dailyClasses, 
  onTimeSelect,
  changingBookingId,
  setChangingBookingId
}: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [showFullClassDialog, setShowFullClassDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
  const isFull = classInfo.attendees.length >= classInfo.capacity;
  
  const getClassDateTime = (date: string, time: string) => {
      const [hours, minutes] = time.split(':');
      const classDate = parseISO(date);
      classDate.setHours(parseInt(hours), parseInt(minutes));
      return classDate;
  }
  
  const isClassPast = isPast(getClassDateTime(classInfo.date, classInfo.time));
  const isChangingMode = !!changingBookingId;
  const isThisClassBeingChanged = changingBookingId === classInfo.id;
  const isSelectableForChange = isChangingMode && !isFull && !isBookedByUser && !isThisClassBeingChanged;


  const findNextAvailableClass = () => {
    const currentTimeIndex = dailyClasses.findIndex(c => c.time === classInfo.time);
    if (currentTimeIndex === -1) return null;

    for (let i = currentTimeIndex + 1; i < dailyClasses.length; i++) {
        const nextClass = dailyClasses[i];
        if (nextClass.attendees.length < nextClass.capacity) {
            return nextClass;
        }
    }
    return null;
  };

  const nextAvailableClass = findNextAvailableClass();
  
  const handleStartChange = () => {
    if (isBookedByUser) {
        setChangingBookingId(classInfo.id);
    }
  };

  const handleBookingAction = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (isFull) {
        setShowFullClassDialog(true);
        return;
    }

    await processBooking(false);
  };
  
  const handleCancelBooking = async () => {
    if (!user) return;
    
    setIsBooking(true);
    try {
        const classDocRef = doc(db, "classes", classInfo.id);
        const attendeeToRemove = classInfo.attendees.find(a => a.uid === user.uid);

        if (attendeeToRemove) {
            await updateDoc(classDocRef, {
                attendees: arrayRemove(attendeeToRemove)
            });
        }
        await onBookingUpdate(classInfo, null);

        toast({
            title: "Reserva Cancelada",
            description: `Tu reserva para ${classInfo.name} ha sido cancelada.`,
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cancelar la reserva. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsBooking(false);
        setShowCancelDialog(false);
    }
  };

  const handleUpdateBooking = async () => {
      if (!user || !changingBookingId) return;
      await processBooking(true, changingBookingId);
  }


  const processBooking = async (isUpdate: boolean, oldClassId?: string) => {
    if (!user || !auth.currentUser) return;
    if (!onBookingUpdate) {
        console.error("onBookingUpdate function is not defined");
        return;
    };

    setIsBooking(true);

    try {
        await auth.currentUser.reload();
        const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Usuario";
        const newAttendee: Attendee = {
          uid: user.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
        };
        await onBookingUpdate(classInfo, newAttendee, oldClassId);
        
        if (isUpdate) {
            setChangingBookingId(null);
        }

    } catch (error: any) {
        console.error("Error processing booking:", error);
    } finally {
        setIsBooking(false);
    }
  }
  
  const renderButton = () => {
    if (isThisClassBeingChanged) {
        return (
            <Button 
                onClick={() => setChangingBookingId(null)}
                variant="outline"
                className="w-full"
            >
                Cancelar Cambio
            </Button>
        );
    }

    if (isSelectableForChange) {
         return (
             <Button
                onClick={handleUpdateBooking}
                disabled={isBooking}
                className="w-full"
             >
                {isBooking ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cambiando...
                    </>
                ) : (
                    'Elegir esta hora'
                )}
             </Button>
         )
    }
    
    if (isBookedByUser) {
        return (
            <div className="flex w-full items-center gap-2">
                <Button
                    onClick={handleStartChange}
                    disabled={isBooking || isClassPast || isChangingMode}
                    className="flex-1"
                >
                    Cambiar
                </Button>
                <Button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isBooking || isClassPast || isChangingMode}
                    variant="destructive"
                    size="icon"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Button 
            onClick={handleBookingAction}
            disabled={isBooking || isClassPast || (isChangingMode && !isBookedByUser)}
            className="w-full"
        >
            {isBooking ? (
                 <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reservando...
                 </>
            ) : isFull ? (
                'Llena'
            ) : (
                'Reservar'
            )}
        </Button>
    )
  }

  return (
    <>
      <div className={cn(
        "bg-card p-4 rounded-lg shadow-sm text-card-foreground border-t-4 border-primary transition-all mb-4",
        isSelectableForChange && "border-2 border-green-500 ring-2 ring-green-500/20"
      )}>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold font-headline text-primary">{classInfo.name}</h3>
              <span className="text-lg md:text-xl font-bold font-headline text-card-foreground">{classInfo.time}</span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
              {classInfo.attendees.map((attendee) => (
                  <Dialog key={attendee.uid}>
                    <DialogTrigger asChild>
                      <div className="flex flex-col items-center justify-center text-center cursor-pointer group">
                          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-md border-2 border-transparent group-hover:border-primary transition-all">
                            <AvatarImage src={attendee.photoURL} />
                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                           <p className="text-xs text-muted-foreground truncate w-full">{attendee.name}</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader className="items-center text-center">
                         <Avatar className="h-32 w-32 rounded-md">
                            <AvatarImage src={attendee.photoURL} />
                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <DialogTitle className="text-2xl">{attendee.name}</DialogTitle>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
              ))}
               {Array.from({ length: classInfo.capacity - classInfo.attendees.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 w-14 sm:h-16 sm:w-16 bg-muted rounded-md"></div>
              ))}
          </div>

          <div className="flex justify-between items-center mt-4">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
              </div>
              <div className="w-1/2">
                {renderButton()}
              </div>
          </div>
      </div>
      <Dialog open={showFullClassDialog} onOpenChange={setShowFullClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clase Completa</DialogTitle>
            <DialogDescription>
              Lo sentimos, no quedan plazas disponibles para la clase de las {classInfo.time}.
            </DialogDescription>
          </DialogHeader>
          {nextAvailableClass ? (
            <div>
              <p className="mb-4">
                Pero no te preocupes, ¡hay plazas en la siguiente clase a las <strong>{nextAvailableClass.time}</strong>!
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  onTimeSelect(nextAvailableClass.time);
                  setShowFullClassDialog(false);
                }}
              >
                Ir a la clase de las {nextAvailableClass.time}
              </Button>
            </div>
          ) : (
            <p>No quedan más clases con plazas disponibles para hoy. Por favor, prueba otro día.</p>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setShowFullClassDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cancelará permanentemente tu reserva. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} disabled={isBooking}>
              {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    