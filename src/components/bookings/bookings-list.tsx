
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { ClassInfo } from "@/types";
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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type PopulatedBooking = {
    id: string; // This will just be the classId for simplicity
    classInfo: ClassInfo;
};

export default function BookingsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<PopulatedBooking[]>([]);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState<PopulatedBooking | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);

      const storedClasses = sessionStorage.getItem('allClasses');
      const currentClasses: ClassInfo[] = storedClasses ? JSON.parse(storedClasses) : [];
      setAllClasses(currentClasses);

      const userBookings = currentClasses
        .filter((classInfo) => 
            classInfo.attendees.some((attendee) => attendee.uid === user.uid)
        )
        .map((classInfo) => ({
            id: classInfo.id, // Use classId as the unique booking identifier
            classInfo: classInfo,
        }));
      
      setBookings(userBookings);
      setIsLoading(false);
    };

    fetchBookings();
  }, [user, authLoading, router]);

  const groupedBookings = useMemo(() => {
    const sortedBookings = [...bookings].sort((a, b) => 
        a.classInfo.date.localeCompare(b.classInfo.date) || a.classInfo.time.localeCompare(b.classInfo.time)
    );

    return sortedBookings.reduce((acc, booking) => {
      const dateKey = booking.classInfo.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(booking);
      return acc;
    }, {} as Record<string, PopulatedBooking[]>);
  }, [bookings]);

  const handleCancel = () => {
    if (bookingToCancel && user) {
        const updatedClasses = allClasses.map(c => {
            if (c.id === bookingToCancel.classInfo.id) {
                return {
                    ...c,
                    attendees: c.attendees.filter(a => a.uid !== user.uid)
                }
            }
            return c;
        }).filter(c => c.attendees.length > 0); // Remove classes with no attendees
      
      setAllClasses(updatedClasses);
      sessionStorage.setItem('allClasses', JSON.stringify(updatedClasses));

      setBookings(prev => prev.filter(b => b.id !== bookingToCancel.id));
      setBookingToCancel(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "eeee, d 'de' MMMM 'de' yyyy", { locale: es });
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
        <AlertDescription className="text-muted-foreground mb-4">
          Aún no has reservado ninguna clase.
        </AlertDescription>
        <Button asChild>
          <Link href="/">
            <CalendarPlus className="mr-2 h-4 w-4" /> Reservar una clase
          </Link>
        </Button>
      </Alert>
    );
  }

  return (
    <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
      <div className="space-y-8">
        {Object.entries(groupedBookings).map(([date, dayBookings]) => (
          <div key={date} className="bg-card rounded-lg shadow-sm">
            <div className="p-4 border-b-4 border-primary/80 flex justify-between items-center">
              <div>
                <h2 className="font-headline text-lg font-bold capitalize">{formatDate(date)}</h2>
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
            Esto cancelará permanentemente tu reserva para {bookingToCancel?.classInfo.name} el {bookingToCancel ? formatDate(bookingToCancel.classInfo.date) : ''} a las {bookingToCancel?.classInfo.time}. Esta acción no se puede deshacer.
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
