
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo } from '@/types';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ClassCardProps {
  classInfo: ClassInfo;
  user: User | null;
  userBookings: string[];
  onBookingUpdate: (classId: string, attendees: string[], bookings: string[]) => void;
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

    setIsBooking(true);
    await new Promise(res => setTimeout(res, 700)); // Simulate API call

    try {
      let updatedAttendees: string[];
      let updatedBookings: string[];
      
      if (isBookedByUser) {
        // Cancel booking
        updatedAttendees = classInfo.attendees.filter(uid => uid !== user.uid);
        updatedBookings = userBookings.filter(id => id !== classInfo.id);
        toast({ title: "Reserva cancelada", description: `Has cancelado tu plaza en ${classInfo.name}.` });
      } else {
        // Create booking
        if (isFull) {
            toast({ variant: "destructive", title: "Clase llena", description: "No quedan plazas disponibles para esta clase." });
            setIsBooking(false);
            return;
        }
        updatedAttendees = [...classInfo.attendees, user.uid];
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
            {Array.from({ length: classInfo.attendees.length }).map((_, i) => (
                <div key={i} className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                </div>
            ))}
             {Array.from({ length: classInfo.capacity - classInfo.attendees.length }).map((_, i) => (
                <div key={i} className="h-12 w-12 bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-md"></div>
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
