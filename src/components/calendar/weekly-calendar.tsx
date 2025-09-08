
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, runTransaction, where, arrayRemove, arrayUnion } from "firebase/firestore";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isBefore, subDays, parseISO, isToday, isTomorrow, endOfWeek, startOfDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import ClassListItem from "./class-list-item";
import TimeSelector from "./time-selector";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

const allTimeSlots = [
    "08:00", "09:15", "10:30", "11:45", "13:00", 
    "14:15", "17:00", "18:15", "19:30", "20:45"
];

const generateClassesForDate = (date: Date, existingClasses: ClassInfo[]): ClassInfo[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'eeee', { locale: es });
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    if (capitalizedDayName === "Sábado" || capitalizedDayName === "Domingo") return [];
    
    let timeSlotsForDay = [...allTimeSlots];
    if (capitalizedDayName === "Viernes") {
        timeSlotsForDay = timeSlotsForDay.filter(time => time !== "20:45");
    }

    return timeSlotsForDay.map(time => {
        const classId = `${dateString}-${time.replace(':', '')}`;
        const existingClass = existingClasses.find(c => c.id === classId);
        
        if (existingClass) {
            return existingClass;
        }

        return {
            id: classId,
            name: 'Entrenamiento',
            description: 'Clase de Entrenamiento.',
            time: time,
            day: capitalizedDayName,
            date: dateString,
            duration: 75,
            capacity: 24,
            attendees: [],
        };
    });
};


function WeeklyCalendarInternal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date');

  const getInitialDate = () => {
    if (dateParam) {
      const dateFromURL = parseISO(dateParam);
      // Allow past dates from URL param
      if (isValid(dateFromURL)) {
        return dateFromURL;
      }
    }
    return new Date();
  };

  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [changingBookingId, setChangingBookingId] = useState<string | null>(null);
  
  const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const endOfCurrentWeek = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const fetchClasses = useCallback(async () => {
    try {
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, 
            where('date', '>=', format(startOfCurrentWeek, 'yyyy-MM-dd')),
            where('date', '<=', format(endOfCurrentWeek, 'yyyy-MM-dd'))
        );
        const querySnapshot = await getDocs(q);
        const fetchedClasses = querySnapshot.docs.map(doc => doc.data() as ClassInfo);
        setAllClasses(fetchedClasses);
    } catch (error) {
        console.error("Error fetching classes:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las clases. Inténtalo de nuevo más tarde."
        });
    }
  }, [startOfCurrentWeek, endOfCurrentWeek, toast]);


  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      try {
        await fetchClasses();
      } catch (error) {
        console.error("Failed initial fetch of classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [fetchClasses]);


  const userBookings = useMemo(() => {
    if (!user) return [];
    return allClasses
        .filter(c => c.attendees.some(a => a.uid === user.uid))
        .map(c => c.id);
  }, [allClasses, user]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);
  
  const isDateDisabled = (date: Date) => {
    const dayName = format(date, 'eeee', { locale: es });
    return dayName === 'sábado' || dayName === 'domingo';
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(startOfCurrentWeek, 7));
    setChangingBookingId(null);
  };

  const handlePreviousWeek = () => {
    setCurrentDate(subDays(startOfCurrentWeek, 7));
    setChangingBookingId(null);
  };
  
  const handleSetCurrentDate = (date: Date) => {
      setCurrentDate(date);
      setChangingBookingId(null);
  };

  const formattedSelectedDate = useMemo(() => {
    if (isToday(currentDate)) {
      return `Hoy, ${format(currentDate, 'd MMMM', { locale: es })}`;
    }
    if (isTomorrow(currentDate)) {
      return `Mañana, ${format(currentDate, 'd MMMM', { locale: es })}`;
    }
    return format(currentDate, 'eeee, d MMMM', { locale: es });
  }, [currentDate]);


  const dailyClasses = useMemo(() => {
    const generated = generateClassesForDate(currentDate, allClasses);
    return generated.sort((a,b) => a.time.localeCompare(b.time));
  }, [currentDate, allClasses]);

  const handleBookingUpdate = async (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string) => {
    if (!user) {
         toast({
            title: "Acción requerida",
            description: "Debes iniciar sesión para reservar una clase.",
        });
        return;
    }
    
    if (newAttendee && !oldClassId) {
      const userHasBookingOnThisDay = userBookings.some(bookingId => 
          bookingId.startsWith(classInfo.date)
      );

      if (userHasBookingOnThisDay) {
          toast({
              variant: "destructive",
              title: "Límite de reservas alcanzado",
              description: "Ya tienes una reserva para este día. No puedes reservar más de una clase diaria.",
          });
          setChangingBookingId(null);
          return;
      }
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            // MOVE BOOKING
            if (oldClassId && newAttendee) {
                const oldClassDocRef = doc(db, "classes", oldClassId);
                const newClassDocRef = doc(db, "classes", classInfo.id);
                
                const [oldClassDoc, newClassDoc] = await Promise.all([
                    transaction.get(oldClassDocRef),
                    transaction.get(newClassDocRef)
                ]);
                
                // Remove from old class
                if (oldClassDoc.exists()) {
                    const attendeeToRemove = oldClassDoc.data().attendees.find((a: Attendee) => a.uid === user.uid);
                    if (attendeeToRemove) {
                        transaction.update(oldClassDocRef, { attendees: arrayRemove(attendeeToRemove) });
                    }
                }
                
                // Add to new class
                if (!newClassDoc.exists()) {
                    transaction.set(newClassDocRef, { ...classInfo, attendees: [newAttendee] });
                } else {
                     const currentClassData = newClassDoc.data() as ClassInfo;
                    if (currentClassData.attendees.length >= currentClassData.capacity) {
                        throw new Error("La clase de destino está llena. No se pudo completar el cambio.");
                    }
                    transaction.update(newClassDocRef, { attendees: arrayUnion(newAttendee) });
                }

            } else { // BOOK OR CANCEL
                const classDocRef = doc(db, "classes", classInfo.id);
                const classDoc = await transaction.get(classDocRef);
                
                if (newAttendee) { // Add/Book
                    if (!classDoc.exists()) {
                        transaction.set(classDocRef, { ...classInfo, attendees: [newAttendee] });
                    } else {
                        const currentClassData = classDoc.data() as ClassInfo;
                        if (currentClassData.attendees.length >= currentClassData.capacity) {
                            throw new Error("La clase está llena. No se pudo completar la reserva.");
                        }
                        if (currentClassData.attendees.some(a => a.uid === newAttendee.uid)) return;
                        transaction.update(classDocRef, { attendees: arrayUnion(newAttendee) });
                    }
                } else { // Cancel
                     if (classDoc.exists()) {
                        const attendeeToRemove = classDoc.data().attendees.find((a: Attendee) => a.uid === user.uid);
                        if (attendeeToRemove) {
                            transaction.update(classDocRef, { attendees: arrayRemove(attendeeToRemove) });
                        }
                    }
                }
            }
        });

        if (newAttendee) {
            toast({ title: oldClassId ? "¡Reserva cambiada!" : "¡Reserva confirmada!", description: `Has asegurado tu plaza para ${classInfo.name} a las ${classInfo.time}.` });
        } else {
            toast({ title: "Reserva cancelada", description: `Tu plaza para ${classInfo.name} ha sido cancelada.` });
        }
        
        await fetchClasses();

    } catch (error: any) {
        console.error("Transaction failed: ", error);
        toast({
            variant: "destructive",
            title: "Error en la reserva",
            description: error.message || "No se pudo actualizar la reserva. Por favor, inténtalo de nuevo.",
        });
        await fetchClasses(); // Refetch even on error to get the latest state
    } finally {
        setChangingBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent p-0 text-foreground space-y-6">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <div>
              <p className="font-bold text-lg capitalize">{formattedSelectedDate}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>
        </div>

        <DaySelector
          currentDate={currentDate}
          setCurrentDate={handleSetCurrentDate}
          weekDates={weekDates}
          isDateDisabled={isDateDisabled}
        />
        <Separator />
        <TimeSelector dailyClasses={dailyClasses} />
      </header>
      
      <main className="flex-1 space-y-4">
        { dailyClasses.length > 0 ? (
            dailyClasses.map(classInfo => (
                <ClassListItem 
                    key={classInfo.id}
                    classInfo={classInfo}
                    user={user}
                    isBookedByUser={userBookings.includes(classInfo.id)}
                    onBookingUpdate={handleBookingUpdate}
                    changingBookingId={changingBookingId}
                    setChangingBookingId={setChangingBookingId}
                />
            ))
         ) : (
          <div className="text-center py-10 bg-card rounded-lg shadow-sm">
            <p className="text-muted-foreground">No hay clases programadas o disponibles para este día.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function WeeklyCalendar() {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <WeeklyCalendarInternal />
    </React.Suspense>
  );
}
