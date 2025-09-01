
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

interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classId: string, attendees: Attendee[]) => void;
  dailyClasses: ClassInfo[];
  onTimeSelect: (time: string) => void;
}

export default function ClassCard({ classInfo, user, userBookings, onBookingUpdate, dailyClasses, onTimeSelect }: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [showFullClassDialog, setShowFullClassDialog] = useState(false);

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

    const currentUser = auth.currentUser;
    await currentUser.reload();
    const userName = currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario";


    setIsBooking(true);
    await new Promise(res => setTimeout(res, 700));

    try {
      let updatedAttendees: Attendee[];
      
      if (isBookedByUser) {
        updatedAttendees = classInfo.attendees.filter(attendee => attendee.uid !== user.uid);
        toast({ title: "Reserva cancelada", description: `Has cancelado tu plaza en ${classInfo.name}.` });
      } else {
        const newAttendee: Attendee = {
          uid: user.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
        };
        updatedAttendees = [...classInfo.attendees, newAttendee];
        toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${classInfo.name} a las ${classInfo.time}.` });
      }

      onBookingUpdate(classInfo.id, updatedAttendees);

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Ha ocurrido un error al procesar tu solicitud." });
    } finally {
      setIsBooking(false);
    }
  };


  return (
    <>
      <div className="bg-card p-4 rounded-lg mb-6 shadow-lg text-card-foreground relative overflow-hidden">
          <div className="w-2 h-full bg-primary absolute left-0 top-0"></div>
          
          <div className="flex justify-between items-center mb-4 ml-4">
              <h3 className="text-xl md:text-2xl font-bold font-headline tracking-wider text-card-foreground">{classInfo.name.toUpperCase()}</h3>
              <span className="text-xl md:text-2xl font-bold font-headline text-card-foreground">{classInfo.time}</span>
          </div>
          
          <div className="ml-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
              {Array.from({ length: classInfo.attendees.length }).map((_, i) => (
                  <Dialog key={classInfo.attendees[i].uid}>
                    <DialogTrigger asChild>
                       <div className="h-10 sm:h-12 w-full bg-primary/80 rounded-md cursor-pointer"></div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader className="items-center text-center">
                         <Avatar className="h-32 w-32 mb-4">
                            <AvatarImage src={classInfo.attendees[i].photoURL} />
                            <AvatarFallback>{classInfo.attendees[i].name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <DialogTitle className="text-2xl">{classInfo.attendees[i].name}</DialogTitle>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
              ))}
               {Array.from({ length: classInfo.capacity - classInfo.attendees.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 sm:h-12 w-full bg-muted/50 rounded-md"></div>
              ))}
          </div>

          <div className="flex justify-between items-center mt-6 ml-4">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
              </div>
              <Button 
                  onClick={handleBookingAction}
                  disabled={isBooking}
                  variant={isBookedByUser ? "destructive" : "default"}
                  className="bg-primary/90 hover:bg-primary text-primary-foreground"
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
    </>
  );
}
