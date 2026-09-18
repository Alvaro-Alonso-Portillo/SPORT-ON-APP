
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import type { ClassInfo, Attendee, CalendarOverride } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, runTransaction, where, arrayRemove, arrayUnion } from "firebase/firestore";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, subDays, parseISO, isToday, isTomorrow, endOfWeek, isValid, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import ClassListItem from "./class-list-item";
import TimeSelector from "./time-selector";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

import { 
  ALL_TIME_SLOTS, 
  AFTERNOON_SLOTS, 
  getDefaultSlotsForDate, 
  isDefaultDateDisabled, 
  getCalendarOverridesForRange 
} from "@/lib/calendar-config";

const generateClassesForDate = (
    date: Date, 
    existingClasses: ClassInfo[], 
    override?: CalendarOverride
): ClassInfo[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'eeee', { locale: es });
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // Si hay una regla explícita y está cerrado, no hay clases
    if (override && !override.isOpen) {
        return [];
    }

    let timeSlotsForDay: string[] = [];

    // Si hay una regla explícita con horas personalizadas
    if (override && override.slots && override.slots.length > 0) {
        timeSlotsForDay = override.slots;
    } else if (override && override.isOpen) {
        // Día abierto explícitamente (ej: domingo abierto) sin horas recortadas -> usar horas completas
        timeSlotsForDay = [...ALL_TIME_SLOTS];
    } else {
        // Horario por defecto según calendario base
        timeSlotsForDay = getDefaultSlotsForDate(date);
    }
    
    if (timeSlotsForDay.length === 0) return [];

    return timeSlotsForDay.map(time => {
        const classId = `${dateString}-${time.replace(':', '')}`;
        const existingClass = existingClasses.find(c => c.id === classId);
        
        if (existingClass) {
            return existingClass;
        }
        
        const capacity = AFTERNOON_SLOTS.includes(time) ? 30 : 24;

        return {
            id: classId,
            name: 'Entrenamiento',
            description: 'Clase de Entrenamiento.',
            time: time,
            day: capitalizedDayName,
            date: dateString,
            duration: 75,
            capacity: capacity,
            attendees: [],
        };
    });
};


function WeeklyCalendarInternal() {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date');

  const getInitialDate = () => {
    if (dateParam) {
      const dateFromURL = parseISO(dateParam);
      if (isValid(dateFromURL)) {
        return dateFromURL;
      }
    }
    return new Date();
  };

  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [calendarOverrides, setCalendarOverrides] = useState<Record<string, CalendarOverride>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [changingBooking, setChangingBooking] = useState<{ classId: string, attendee: Attendee } | null>(null);
  
  const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const endOfCurrentWeek = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
        const startDateStr = format(startOfCurrentWeek, 'yyyy-MM-dd');
        const endDateStr = format(endOfCurrentWeek, 'yyyy-MM-dd');

        const classesRef = collection(db, 'classes');
        const q = query(classesRef, 
            where('date', '>=', startDateStr),
            where('date', '<=', endDateStr)
        );

        const [querySnapshot, overrides] = await Promise.all([
            getDocs(q),
            getCalendarOverridesForRange(startDateStr, endDateStr)
        ]);

        const fetchedClasses = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ClassInfo);
        setAllClasses(fetchedClasses);
        setCalendarOverrides(overrides);
    } catch (error) {
        console.error("Error fetching classes and calendar overrides:", error);
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
    fetchClasses();
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
  
  const isDateDisabled = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const override = calendarOverrides[dateString];

    // Si el administrador ha configurado una regla para este día, esa regla manda
    if (override) {
      return !override.isOpen;
    }

    // Si no hay regla, aplicar las reglas estándar del centro
    return isDefaultDateDisabled(date).disabled;
  }, [calendarOverrides]);

  const handleNextWeek = () => {
    setCurrentDate(addDays(startOfCurrentWeek, 7));
    setChangingBooking(null);
  };

  const handlePreviousWeek = () => {
    setCurrentDate(subDays(startOfCurrentWeek, 7));
    setChangingBooking(null);
  };
  
  const handleSetCurrentDate = (date: Date) => {
      setCurrentDate(date);
      setChangingBooking(null);
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
    if (isDateDisabled(currentDate)) {
        return [];
    }
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const override = calendarOverrides[dateString];
    const generated = generateClassesForDate(currentDate, allClasses, override);
    return generated.sort((a,b) => a.time.localeCompare(b.time));
  }, [currentDate, allClasses, isDateDisabled, calendarOverrides]);

  const handleBookingUpdate = async (classInfo: ClassInfo, newAttendee: Omit<Attendee, 'status'> | null, oldClassId?: string, attendeeToUpdate?: Attendee) => {
    const userForCheck = attendeeToUpdate || newAttendee;
    if (!userForCheck) return;

    // RULE: Check for existing bookings on the same day for NEW reservations.
    if (newAttendee && !oldClassId) { // This is a new booking, not a change.
      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("date", "==", classInfo.date));
      const dayClassesSnapshot = await getDocs(q);

      let hasBooking = false;
      dayClassesSnapshot.forEach(doc => {
        const classData = doc.data() as ClassInfo;
        if (classData.attendees.some(a => a.uid === userForCheck.uid)) {
            hasBooking = true;
        }
      });

      if (hasBooking) {
        toast({
            variant: "destructive",
            title: "Límite alcanzado",
            description: "Solo puedes tener una reserva por día.",
        });
        return;
      }
    }

    try {
        await runTransaction(db, async (transaction) => {
            const newClassDocRef = doc(db, "classes", classInfo.id);
            const newClassDoc = await transaction.get(newClassDocRef);
            
            let oldClassDoc;
            let oldClassDocRef;
            if (oldClassId) {
                oldClassDocRef = doc(db, "classes", oldClassId);
                oldClassDoc = await transaction.get(oldClassDocRef);
            } else if (attendeeToUpdate) { 
                oldClassDocRef = doc(db, "classes", classInfo.id);
                oldClassDoc = await transaction.get(oldClassDocRef);
            }

            const attendeeWithStatus: Attendee | null = newAttendee ? { ...newAttendee, status: 'reservado' } : null;

            if (oldClassId && attendeeWithStatus && attendeeToUpdate && oldClassDocRef && oldClassDoc) {
                const attendeeInOldClass = oldClassDoc.data()?.attendees.find((a: Attendee) => a.uid === attendeeToUpdate.uid);
                if (attendeeInOldClass) {
                    transaction.update(oldClassDoc.ref, { attendees: arrayRemove(attendeeInOldClass) });
                }
                
                if (!newClassDoc.exists()) {
                     const { id, ...classDataToSave } = classInfo;
                    transaction.set(newClassDocRef, { ...classDataToSave, attendees: [] }); 
                }
                transaction.update(newClassDocRef, { attendees: arrayUnion(attendeeWithStatus) });
            } 
            else if (!attendeeWithStatus && attendeeToUpdate && oldClassDocRef && oldClassDoc) {
                const existingAttendee = oldClassDoc.data()?.attendees.find((a: Attendee) => a.uid === attendeeToUpdate.uid);
                if (existingAttendee) {
                    transaction.update(oldClassDoc.ref, { attendees: arrayRemove(existingAttendee) });
                }
            }
            else if (attendeeWithStatus) {
                 if (!newClassDoc.exists()) {
                    const { id, ...classDataToSave } = classInfo;
                    transaction.set(newClassDocRef, { ...classDataToSave, attendees: [] });
                }
                
                const currentClassData = newClassDoc.exists() ? newClassDoc.data() : { attendees: [], capacity: classInfo.capacity };
                if (currentClassData.attendees.length >= currentClassData.capacity) {
                    throw new Error("La clase está llena. No se pudo completar la reserva.");
                }
                if (currentClassData.attendees.some((a: Attendee) => a.uid === attendeeWithStatus.uid)) {
                    return; // Already enrolled, do nothing.
                }
                
                transaction.update(newClassDocRef, { attendees: arrayUnion(attendeeWithStatus) });
            }
        });
        
        if (attendeeToUpdate && !newAttendee) {
            toast({ title: "Reserva cancelada/eliminada", description: `La plaza para ${attendeeToUpdate.name} ha sido liberada.` });
        } else if (newAttendee) {
            const message = oldClassId ? "¡Reserva cambiada!" : "¡Reserva confirmada!";
            toast({ title: message, description: `${newAttendee.name} tiene su plaza para ${classInfo.name} a las ${classInfo.time}.` });
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
        setChangingBooking(null);
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
      
      <main className="flex-1 space-y-2 sm:space-y-2.5">
        { dailyClasses.length > 0 ? (
            dailyClasses.map(classInfo => (
                <ClassListItem 
                    key={classInfo.id}
                    classInfo={classInfo}
                    user={user}
                    isBookedByUser={userBookings.includes(classInfo.id)}
                    onBookingUpdate={handleBookingUpdate}
                    changingBooking={changingBooking}
                    setChangingBooking={setChangingBooking}
                />
            ))
         ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow-sm border p-6 space-y-1">
            <p className="text-muted-foreground font-medium">
              {calendarOverrides[format(currentDate, 'yyyy-MM-dd')]?.reason 
                ? `Cerrado: ${calendarOverrides[format(currentDate, 'yyyy-MM-dd')].reason}`
                : "No hay clases programadas o disponibles para este día."}
            </p>
            {isDateDisabled(currentDate) && !calendarOverrides[format(currentDate, 'yyyy-MM-dd')]?.reason && (
              <p className="text-xs text-muted-foreground/80">Este día se encuentra cerrado según el horario habitual.</p>
            )}
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
