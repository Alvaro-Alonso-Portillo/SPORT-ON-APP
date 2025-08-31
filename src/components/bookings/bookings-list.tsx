
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, ClassInfo } from "@/types";
import { MOCK_CLASSES, MOCK_USER_BOOKINGS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarX, Edit, Trash2, CalendarPlus, Clock, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function BookingsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<(Booking & { classInfo: ClassInfo })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 500)); 

      const userBookings = MOCK_USER_BOOKINGS.filter(b => b.userId === 'user-123');
      const populatedBookings = userBookings.map(booking => {
        const classInfo = MOCK_CLASSES.find(c => c.id === booking.classId);
        return { ...booking, classInfo: classInfo! };
      }).filter(b => b.classInfo);
      
      setBookings(populatedBookings);
      setIsLoading(false);
    };

    fetchBookings();
  }, [user, authLoading, router]);

  const handleCancel = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
        <Alert className="text-center p-8 border-dashed">
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
    <div className="space-y-4">
      {bookings.map((booking, index) => (
        <div key={booking.id} className="bg-card rounded-lg border-l-4 border-primary p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 grid gap-1">
                <p className="font-headline text-lg font-semibold">{booking.classInfo.name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.classInfo.day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{booking.classInfo.time}</span>
                    </div>
                </div>
            </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled>
                <Edit className="mr-2 h-4 w-4"/> Modificar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4"/> Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto cancelará permanentemente tu reserva para {booking.classInfo.name}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleCancel(booking.id)}>
                    Sí, Cancelar Reserva
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
