
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, ClassInfo, Attendee } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarX, CalendarPlus, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const timeSlots = [
    "08:00", "09:15", "10:30", "11:45", "13:00", 
    "14:15", "17:00", "18:15", "19:30", "20:45"
];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// NOTE: This is a simplified, temporary state management. 
// In a real app, this should come from a shared state (like Context or Zustand) or be fetched from the DB.
const generateAllPossibleClasses = (): ClassInfo[] => {
  const allClasses: ClassInfo[] = [];
  daysOfWeek.forEach(day => {
    timeSlots.forEach(time => {
      const classId = `${day.toLowerCase().substring(0,3)}-${time.replace(':', '')}`;
      allClasses.push({
        id: classId,
        name: 'Entrenamiento',
        description: 'Clase de Entrenamiento.',
        time: time,
        day: day,
        duration: 75,
        capacity: 24,
        attendees: [],
      });
    });
  });
  // Simulate some attendees for initial state
  if (typeof window !== 'undefined' && !sessionStorage.getItem('classesInitialized')) {
    allClasses[0].attendees.push({uid: 'user-xxx', name: 'Alex'});
    allClasses[5].attendees.push({uid: 'user-yyy', name: 'Sara'});
    sessionStorage.setItem('classesInitialized', 'true');
  }
  return allClasses;
};


type PopulatedBooking = {
    id: string;
    userId: string;
    classId: string;
    classInfo: ClassInfo;
};

export default function BookingsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<PopulatedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [bookingToCancel, setBookingToCancel] = useState<PopulatedBooking | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);

      // In a real app, this would be a fetch call. Here we simulate it.
      // We retrieve the state from sessionStorage to reflect calendar changes.
      const storedClasses = sessionStorage.getItem('allClasses');
      const currentClasses = storedClasses ? JSON.parse(storedClasses) : generateAllPossibleClasses();
      setAllClasses(currentClasses);

      const userBookings = currentClasses
        .filter((classInfo: ClassInfo) => 
            classInfo.attendees.some((attendee: Attendee) => attendee.uid === user.uid)
        )
        .map((classInfo: ClassInfo, index: number) => ({
            id: `booking-${user.uid}-${classInfo.id}-${index}`,
            userId: user.uid,
            classId: classInfo.id,
            classInfo: classInfo,
        }));
      
      setBookings(userBookings);
      setIsLoading(false);
    };

    fetchBookings();
  }, [user, authLoading, router]);

  const groupedBookings = useMemo(() => {
    const sortedBookings = [...bookings].sort((a, b) => {
        const dayA = daysOfWeek.indexOf(a.classInfo.day);
        const dayB = daysOfWeek.indexOf(b.classInfo.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.classInfo.time.localeCompare(b.classInfo.time);
    });

    return sortedBookings.reduce((acc, booking) => {
      const day = booking.classInfo.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(booking);
      return acc;
    }, {} as Record<string, PopulatedBooking[]>);
  }, [bookings]);

  const handleCancel = () => {
    if (bookingToCancel && user) {
        const updatedClasses = allClasses.map(c => {
            if (c.id === bookingToCancel.classId) {
                return {
                    ...c,
                    attendees: c.attendees.filter(a => a.uid !== user.uid)
                }
            }
            return c;
        });
      setAllClasses(updatedClasses);
      sessionStorage.setItem('allClasses', JSON.stringify(updatedClasses));

      setBookings(prev => prev.filter(b => b.id !== bookingToCancel.id));
      setBookingToCancel(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-card rounded-lg shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Alert className="text-center p-8 border-dashed bg-card shadow-sm">
        <CalendarX className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <AlertTitle className="font-headline text-lg">No hay próximas reservas</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Aún no has reservado ninguna clase.
        </AlertDescription>
        <Button asChild className="mt-4">
          <Link href="/">
            <CalendarPlus className="mr-2 h-4 w-4" /> Reservar una clase
          </Link>
        </Button>
      </Alert>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-8">
        {Object.entries(groupedBookings).map(([day, dayBookings]) => (
          <div key={day} className="bg-card rounded-lg shadow-sm">
            <div className="p-4 border-b-4 border-primary/80 flex justify-between items-center">
              <div>
                <h2 className="font-headline text-lg font-bold">{day}</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {dayBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                  <div className="flex items-center gap-4">
                     <div className="bg-muted p-3 rounded-md">
                        <span className="font-bold text-lg text-primary">{booking.classInfo.time.split(':')[0]}</span>
                     </div>
                     <div>
                        <p className="font-semibold">{booking.classInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.classInfo.time}</p>
                     </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setBookingToCancel(booking)}>
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Cancelar Reserva</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto cancelará permanentemente tu reserva para {bookingToCancel?.classInfo.name} el {bookingToCancel?.classInfo.day} a las {bookingToCancel?.classInfo.time}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setBookingToCancel(null)}>Volver</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            Sí, Cancelar Reserva
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
