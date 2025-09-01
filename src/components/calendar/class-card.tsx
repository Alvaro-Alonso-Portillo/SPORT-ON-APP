
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classId: string, attendees: Attendee[], bookings: string[]) => void;
}

export default function ClassCard({ classInfo, user, userBookings, onBookingUpdate }: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  
  const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
  const isFull = classInfo.attendees.length >= classInfo.capacity;

  const handleBookingAction = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const userName = user.displayName || user.email?.split('@')[0] || "Usuario";

    setIsBooking(true);
    await new Promise(res => setTimeout(res, 700)); // Simulate API call

    try {
      let updatedAttendees: Attendee[];
      let updatedBookings: string[];
      
      if (isBookedByUser) {
        // Cancel booking
        updatedAttendees = classInfo.attendees.filter(attendee => attendee.uid !== user.uid);
        updatedBookings = userBookings.filter(id => id !== classInfo.id);
        toast({ title: "Reserva cancelada", description: `Has cancelado tu plaza en ${classInfo.name}.` });
      } else {
        // Create booking
        if (isFull) {
            toast({ variant: "destructive", title: "Clase llena", description: "No quedan plazas disponibles para esta clase." });
            setIsBooking(false);
            return;
        }
        const newAttendee: Attendee = {
          uid: user.uid,
          name: userName,
          photoURL: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
        };
        updatedAttendees = [...classInfo.attendees, newAttendee];
        updatedBookings = [...userBookings, classInfo.id];
        toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${classInfo.name} a las ${classInfo.time}.` });
      }

      onBookingUpdate(classInfo.id, updatedAttendees, updatedBookings);

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Ha ocurrido un error al procesar tu solicitud." });
    } finally {
      setIsBooking(false);
    }
  };


  return (
    <div className="bg-secondary p-4 rounded-lg border-l-4 border-primary mb-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-headline tracking-wider">{classInfo.name.toUpperCase()}</h3>
            <span className="text-xl font-bold font-headline">{classInfo.time}</span>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
            {classInfo.attendees.map((attendee) => (
                <div key={attendee.uid} className="flex flex-col items-center justify-center p-1 text-center">
                    <Avatar className="h-10 w-10 mb-1">
                      <AvatarImage src={attendee.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${attendee.uid}`} />
                      <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-semibold text-primary truncate w-full">{attendee.name}</p>
                </div>
            ))}
             {Array.from({ length: classInfo.capacity - classInfo.attendees.length }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 w-12 bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-md"></div>
            ))}
        </div>

        <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
            </div>
            <Button 
                onClick={handleBookingAction}
                disabled={isBooking || (!isBookedByUser && isFull)}
                variant={isBookedByUser ? "destructive" : "default"}
                size="sm"
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
