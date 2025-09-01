
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, runTransaction, where, arrayRemove, arrayUnion } from "firebase/firestore";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format, startOfWeek, addDays, isBefore, subDays, parseISO, isToday, isTomorrow, endOfWeek, startOfDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import TimeSelector from "./time-selector";
import BookingConfirmationModal from "./booking-confirmation-modal";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date');

  const getInitialDate = () => {
    if (dateParam) {
      const dateFromURL = parseISO(dateParam);
      if (isValid(dateFromURL) && !isBefore(dateFromURL, startOfDay(new Date()))) {
        return dateFromURL;
      }
    }
    return new Date();
  };

  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [classToBook, setClassToBook] = useState<ClassInfo | null>(null);
  
  const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const endOfCurrentWeek = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
        setIsLoading(false);
    }
  }, [startOfCurrentWeek, endOfCurrentWeek, toast]);


  useEffect(() => {
    if (authLoading) return;
    fetchClasses();
  }, [user, authLoading, fetchClasses]);


  const userBookings = useMemo(() => {
    if (!user) return [];
    return allClasses
        .filter(c => c.attendees.some(a => a.uid === user.uid))
        .map(c => c.id);
  }, [allClasses, user]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);

  const isPastWeek = isBefore(startOfCurrentWeek, startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(startOfCurrentWeek, 7));
  };

  const handlePreviousWeek = () => {
    if (isPastWeek) return;
    setCurrentDate(subDays(startOfCurrentWeek, 7));
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
    if(isBefore(startOfDay(currentDate), startOfDay(new Date()))) return [];
    const generated = generateClassesForDate(currentDate, allClasses);
    const now = new Date();

    if (isToday(currentDate)) {
      return generated.filter(classInfo => {
        const [hours, minutes] = classInfo.time.split(':');
        const classDateTime = new Date(currentDate);
        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return isBefore(now, classDateTime);
      });
    }
    
    return generated;
  }, [currentDate, allClasses]);

  const handleTimeSelect = useCallback((classInfo: ClassInfo) => {
      if (!user) {
        toast({
            title: "Acción requerida",
            description: "Debes iniciar sesión para reservar una clase.",
        });
        return;
      }
      setClassToBook(classInfo);
  }, [user, toast]);

  const handleBookingUpdate = async (classInfo: ClassInfo, newAttendee: Attendee | null, oldClassId?: string) => {
    if (!user) return;
    
    if (newAttendee) {
      const userHasBookingOnThisDay = userBookings.some(bookingId => 
          bookingId.startsWith(classInfo.date) && bookingId !== oldClassId
      );

      if (userHasBookingOnThisDay) {
          toast({
              variant: "destructive",
              title: "Límite de reservas alcanzado",
              description: "Ya tienes una reserva para este día. No puedes reservar más de una clase diaria.",
          });
          return;
      }
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const classDocRef = doc(db, "classes", classInfo.id);
            const classDoc = await transaction.get(classDocRef);
            
            if (newAttendee) { 
                if (!classDoc.exists()) {
                    const newClassData = { ...classInfo, attendees: [newAttendee] };
                    transaction.set(classDocRef, newClassData);
                } else {
                    const currentClassData = classDoc.data() as ClassInfo;
                    if (currentClassData.attendees.length >= currentClassData.capacity) {
                        throw new Error("La clase está llena. No se pudo completar la reserva.");
                    }
                    if (currentClassData.attendees.some(a => a.uid === newAttendee.uid)) {
                        return;
                    }
                    transaction.update(classDocRef, { attendees: arrayUnion(newAttendee) });
                }
            }
        });

        if (newAttendee) {
            toast({ title: "¡Reserva confirmada!", description: `Has reservado tu plaza para ${classInfo.name} a las ${classInfo.time}.` });
        }
        
        await fetchClasses();

    } catch (error: any) {
        console.error("Transaction failed: ", error);
        toast({
            variant: "destructive",
            title: "Error en la reserva",
            description: error.message || "No se pudo actualizar la reserva. Por favor, inténtalo de nuevo.",
        });
        await fetchClasses();
    } finally {
        setClassToBook(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent p-0 text-foreground">
      <div className="flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-4 p-4 md:p-0 md:pt-4">
          <div className="flex items-center gap-4">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <div>
              <p className="font-bold text-lg capitalize">{formattedSelectedDate}</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek} disabled={isPastWeek}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>
        </div>

        <DaySelector
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          weekDates={weekDates}
          isDateDisabled={isDateDisabled}
        />
      </div>

      <div className="mt-6 flex-1 overflow-y-auto scroll-smooth p-4 md:p-0">
         {dailyClasses.length > 0 ? (
            <TimeSelector
              dailyClasses={dailyClasses}
              onTimeSelect={handleTimeSelect}
              userBookings={userBookings}
              user={user}
            />
         ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay clases programadas o disponibles para este día.</p>
          </div>
        )}
      </div>

      {classToBook && (
          <BookingConfirmationModal
            classInfo={classToBook}
            isOpen={!!classToBook}
            onClose={() => setClassToBook(null)}
            onConfirm={handleBookingUpdate}
            user={user}
          />
      )}
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
