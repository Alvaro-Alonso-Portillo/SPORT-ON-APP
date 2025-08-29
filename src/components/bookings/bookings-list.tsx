"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { Booking, ClassInfo } from "@/types";
import { MOCK_CLASSES, MOCK_USER_BOOKINGS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarX, Edit, Trash2, CalendarPlus } from "lucide-react";
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
        <Alert className="text-center p-8">
            <CalendarX className="h-6 w-6 mx-auto mb-2" />
            <AlertTitle className="font-headline text-lg">No hay próximas reservas</AlertTitle>
            <AlertDescription>
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
      {bookings.map(booking => (
        <Card key={booking.id} className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{booking.classInfo.name}</CardTitle>
            <CardDescription>
              {booking.classInfo.day} a las {booking.classInfo.time}
            </CardDescription>
          </CardHeader>
          <CardFooter className="p-4 md:p-6 flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto" disabled>
                <Edit className="mr-2 h-4 w-4"/> Modificar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
