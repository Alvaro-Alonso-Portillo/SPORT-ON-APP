
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classId: string, attendees: Attendee[]) => void;
}

export default function ClassCard({ classInfo, user, userBookings, onBookingUpdate }: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  
  const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
  const isFull = classInfo.attendees.length >= classInfo.capacity;

  const handleBookingAction = async () => {
    if (!user || !auth.currentUser) {
      router.push('/login');
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
        if (isFull) {
            toast({ variant: "destructive", title: "Clase llena", description: "No quedan plazas disponibles para esta clase." });
            setIsBooking(false);
            return;
        }
        const newAttendee: Attendee = {
          uid: user.uid,
          name: userName,
          photoURL: currentUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
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
    <div className="bg-card p-4 rounded-lg border-t-4 border-primary mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <h3 className="text-2xl font-bold font-headline tracking-wider">{classInfo.name.toUpperCase()}</h3>
            </div>
            <span className="text-2xl font-bold font-headline">{classInfo.time}</span>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
            {classInfo.attendees.map((attendee) => (
                <Dialog key={attendee.uid}>
                  <DialogTrigger asChild>
                    <div className="flex flex-col items-center justify-center p-1 text-center cursor-pointer group">
                        <Avatar className="h-16 w-16 mb-1 border-2 border-transparent group-hover:border-primary transition-all">
                          <AvatarImage src={attendee.photoURL} />
                          <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-foreground truncate w-full">{attendee.name}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader className="items-center text-center">
                       <Avatar className="h-32 w-32 mb-4">
                          <AvatarImage src={attendee.photoURL} />
                          <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      <DialogTitle className="text-2xl">{attendee.name}</DialogTitle>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
            ))}
             {Array.from({ length: classInfo.capacity - classInfo.attendees.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-center h-[90px] w-full bg-background border-2 border-dashed border-muted rounded-md"></div>
            ))}
        </div>

        <div className="flex justify-between items-center mt-6">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
            </div>
            <Button 
                onClick={handleBookingAction}
                disabled={isBooking || (!isBookedByUser && isFull)}
                variant={isBookedByUser ? "destructive" : "default"}
            >
                {isBooking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isBookedByUser ? (
                    'Cancelar Reserva'
                ) : isFull ? (
                    'Clase Llena'
                ) : (
                    'Reservar Plaza'
                )}
            </Button>
        </div>
    </div>
  );
}
