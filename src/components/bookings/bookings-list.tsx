
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, updateDoc, arrayRemove, where } from "firebase/firestore";
import type { ClassInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarX, CalendarPlus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

type PopulatedBooking = {
    id: string; // This will be the classId
    classInfo: ClassInfo;
};

export default function BookingsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PopulatedBooking[]>([]);
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
      try {
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where("attendees", "array-contains", { 
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
        }));

        const querySnapshot = await getDocs(q);
        const userBookings = querySnapshot.docs.map(doc => ({
            id: doc.id,
            classInfo: doc.data() as ClassInfo,
        }));
        setBookings(userBookings);

      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar tus reservas."
        });
      }
      setIsLoading(false);
    };

    fetchBookings();
  }, [user, authLoading, router, toast]);

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

  const handleCancel = async () => {
    if (!bookingToCancel || !user) return;

    try {
        const classDocRef = doc(db, "classes", bookingToCancel.id);
        const attendeeToRemove = bookingToCancel.classInfo.attendees.find(a => a.uid === user.uid);

        if (attendeeToRemove) {
            await updateDoc(classDocRef, {
                attendees: arrayRemove(attendeeToRemove)
            });
        }
        
        setBookings(prev => prev.filter(b => b.id !== bookingToCancel.id));
        toast({
            title: "Reserva Cancelada",
            description: `Tu reserva para ${bookingToCancel.classInfo.name} ha sido cancelada.`,
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cancelar la reserva. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setBookingToCancel(null);
    }
  };
  
  const handleModify = (booking: PopulatedBooking) => {
    const targetDate = booking.classInfo.date;
    router.push(`/?date=${targetDate}`);
  };


  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "eeee, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return dateString; // Fallback for invalid date format
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
                       <DropdownMenuItem onSelect={() => handleModify(booking)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Modificar Reserva</span>
                      </DropdownMenuItem>
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
