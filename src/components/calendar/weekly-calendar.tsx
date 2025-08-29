"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ClassInfo } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { MOCK_CLASSES, MOCK_USER_BOOKINGS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, UserCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export default function WeeklyCalendar() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const classesMap = useMemo(() => {
    const map = new Map<string, ClassInfo>();
    classes.forEach(c => map.set(`${c.day}-${c.time}`, c));
    return map;
  }, [classes]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 500));
      setClasses(MOCK_CLASSES);
      if (user) {
        setUserBookings(MOCK_USER_BOOKINGS.map(b => b.classId));
      } else {
        setUserBookings([]);
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleClassClick = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setIsModalOpen(true);
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsBooking(true);
    await new Promise(res => setTimeout(res, 1000));
    if (selectedClass) {
      setUserBookings(prev => [...prev, selectedClass.id]);
    }
    setIsBooking(false);
    setIsModalOpen(false);
  };
  
  const handleCancelBooking = async () => {
    setIsBooking(true);
    await new Promise(res => setTimeout(res, 1000));
    if(selectedClass){
      setUserBookings(prev => prev.filter(id => id !== selectedClass.id));
    }
    setIsBooking(false);
    setIsModalOpen(false);
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">Horario Semanal de Clases</CardTitle>
          <CardDescription>Haz clic en una clase para ver los detalles y reservar tu plaza.</CardDescription>
        </CardHeader>
        <CardContent>
          {!user && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>¡Bienvenido, Invitado!</AlertTitle>
              <AlertDescription>
                Por favor, <Link href="/login" className="font-bold underline text-primary">inicia sesión</Link> o <Link href="/signup" className="font-bold underline text-primary">regístrate</Link> para reservar clases.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] border-t border-l border-border rounded-t-lg overflow-x-auto">
            <div className="p-2 border-b border-r bg-muted sticky left-0 z-10"></div>
            {daysOfWeek.map(day => (
              <div key={day} className="p-2 text-center font-headline border-b border-r bg-muted text-sm md:text-base">
                {day}
              </div>
            ))}

            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="p-2 h-24 flex items-center justify-center text-xs md:text-sm text-muted-foreground border-b border-r bg-muted sticky left-0 z-10">
                  {time}
                </div>
                {daysOfWeek.map(day => {
                  const classInfo = classesMap.get(`${day}-${time}`);
                  if (classInfo) {
                    const isBooked = userBookings.includes(classInfo.id);
                    const isFull = classInfo.attendees.length >= classInfo.capacity;
                    return (
                      <div key={day} className="p-1 border-b border-r h-24">
                        <button
                          onClick={() => handleClassClick(classInfo)}
                          disabled={isFull && !isBooked}
                          className={cn(
                            "w-full h-full rounded-md p-1.5 md:p-2 text-left transition-all text-xs md:text-sm flex flex-col justify-between",
                            isBooked ? "bg-accent/20 ring-2 ring-accent text-accent-foreground" : "bg-card hover:bg-muted",
                            isBooked && "text-accent-foreground font-semibold",
                            isFull && !isBooked && "opacity-50 cursor-not-allowed bg-muted/50",
                          )}
                        >
                          <div>
                            <p className="font-bold truncate">{classInfo.instructor}</p>
                          </div>
                          {isFull && !isBooked && <span className="text-destructive font-semibold text-xs">Completo</span>}
                          {isBooked && <UserCheck className="w-4 h-4 text-accent self-end" />}
                        </button>
                      </div>
                    );
                  }
                  return <div key={day} className="border-b border-r h-24"></div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{selectedClass.name}</DialogTitle>
                <DialogDescription>
                  {selectedClass.day} a las {selectedClass.time} con {selectedClass.instructor}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <p>{selectedClass.description}</p>
                <p className="text-sm text-muted-foreground">Duración: {selectedClass.duration} minutos</p>
                <p className="text-sm text-muted-foreground">Plazas restantes: {selectedClass.capacity - selectedClass.attendees.length}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                {user && (userBookings.includes(selectedClass.id) ? (
                    <Button variant="destructive" onClick={handleCancelBooking} disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cancelar Reserva
                    </Button>
                ) : (
                    <Button onClick={handleBooking} disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reservar Ahora
                    </Button>
                ))}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
