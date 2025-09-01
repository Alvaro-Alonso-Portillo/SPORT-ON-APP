
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Users, Loader2 } from 'lucide-react';
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


interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classInfo: ClassInfo, attendee: Attendee | null, oldClassId?: string) => Promise<void>;
  dailyClasses: ClassInfo[];
  onTimeSelect: (time: string) => void;
}

export default function ClassCard({ classInfo, user, userBookings, onBookingUpdate, dailyClasses, onTimeSelect }: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [showFullClassDialog, setShowFullClassDialog] = useState(false);
  const [showChangeBookingDialog, setShowChangeBookingDialog] = useState(false);
  const [existingBooking, setExistingBooking] = useState<string | null>(null);

  const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
  const isFull = classInfo.attendees.length >= classInfo.capacity;
  
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

  const handleBookingAction = async () => {
    if (!user || !auth.currentUser) {
      router.push('/login');
      return;
    }
    
    if (!isBookedByUser && isFull) {
        setShowFullClassDialog(true);
        return;
    }

    // Check for existing booking on the same day
    if (!isBookedByUser) {
        const bookingOnSameDay = userBookings.find(bookingId => bookingId.startsWith(classInfo.date));
        if (bookingOnSameDay) {
            setExistingBooking(bookingOnSameDay);
            setShowChangeBookingDialog(true);
            return;
        }
    }

    await processBooking();
  };

  const processBooking = async (oldClassIdToCancel?: string) => {
    if (!user || !auth.currentUser) return; // Should be logged in at this point

    setIsBooking(true);

    try {
        if (isBookedByUser) {
            await onBookingUpdate(classInfo, null);
            toast({ title: "Reserva cancelada", description: `Has cancelado tu plaza en ${classInfo.name}.` });
        } else {
            await auth.currentUser.reload();
            const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Usuario";
            const newAttendee: Attendee = {
              uid: user.uid,
              name: userName,
              photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
            };
            await onBookingUpdate(classInfo, newAttendee, oldClassIdToCancel);
            toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${classInfo.name} a las ${classInfo.time}.` });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Ha ocurrido un error al procesar tu solicitud." });
    } finally {
        setIsBooking(false);
        setShowChangeBookingDialog(false);
        setExistingBooking(null);
    }
  }

  return (
    <>
      <div className="bg-card p-2 rounded-lg shadow-sm text-card-foreground border-t-4 border-primary">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold font-headline text-primary">{classInfo.name}</h3>
              <span className="text-lg md:text-xl font-bold font-headline text-card-foreground">{classInfo.time}</span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
              {classInfo.attendees.map((attendee) => (
                  <Dialog key={attendee.uid}>
                    <DialogTrigger asChild>
                      <div className="flex flex-col items-center justify-center text-center cursor-pointer group">
                          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-transparent group-hover:border-primary transition-all">
                            <AvatarImage src={attendee.photoURL} />
                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                           <p className="text-xs text-muted-foreground truncate w-full">{attendee.name}</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader className="items-center text-center">
                         <Avatar className="h-32 w-32">
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
              <Button 
                  onClick={handleBookingAction}
                  disabled={isBooking}
                  variant={isBookedByUser ? "destructive" : "default"}
              >
                  {isBooking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isBookedByUser ? (
                      'Cancelar'
                  ) : isFull ? (
                      'Llena'
                  ) : (
                      'Reservar'
                  )}
              </Button>
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

      <AlertDialog open={showChangeBookingDialog} onOpenChange={setShowChangeBookingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ya tienes una reserva este día</AlertDialogTitle>
            <AlertDialogDescription>
                Ya tienes una reserva para el {classInfo.date}. ¿Te gustaría cancelar la reserva existente y reservar esta en su lugar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowChangeBookingDialog(false)}>No, mantener la actual</AlertDialogCancel>
            <AlertDialogAction onClick={() => processBooking(existingBooking ?? undefined)}>Sí, cambiar reserva</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
