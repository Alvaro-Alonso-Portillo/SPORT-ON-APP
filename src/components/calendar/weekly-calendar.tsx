
"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isBefore, endOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import TimeSelector from "./time-selector";
import ClassCard from "./class-card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const timeSlots = [
    "08:00", "09:15", "10:30", "11:45", "13:00", 
    "14:15", "17:00", "18:15", "19:30", "20:45"
];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const generateAllPossibleClasses = (): ClassInfo[] => {
  const allClasses: ClassInfo[] = [];
  daysOfWeek.forEach(day => {
    // No generar clases para Sábado y Domingo
    if (day === "Sábado" || day === "Domingo") return;
    
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
  return allClasses;
};

export default function WeeklyCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const storedClasses = sessionStorage.getItem('allClasses');
      if (storedClasses) {
        setAllClasses(JSON.parse(storedClasses));
      } else {
        const generatedClasses = generateAllPossibleClasses();
        generatedClasses[0].attendees.push({uid: 'user-xxx', name: 'Alex'});
        generatedClasses[5].attendees.push({uid: 'user-yyy', name: 'Sara'});
        setAllClasses(generatedClasses);
        sessionStorage.setItem('allClasses', JSON.stringify(generatedClasses));
      }
      
      if (user) {
        const currentUserBookings = (JSON.parse(sessionStorage.getItem('allClasses') || '[]') as ClassInfo[])
            .filter(c => c.attendees.some(a => a.uid === user.uid))
            .map(c => c.id);
        setUserBookings(currentUserBookings);
      } else {
        setUserBookings([]);
      }

      setIsLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);

  const isPastWeek = isBefore(startOfCurrentWeek, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleNextWeek = () => {
    setCurrentDate(addDays(startOfCurrentWeek, 7));
  };

  const handlePreviousWeek = () => {
    if (isPastWeek) return;
    setCurrentDate(subDays(startOfCurrentWeek, 7));
  };


  const selectedDayName = useMemo(() => {
      const day = format(currentDate, 'eeee', { locale: es });
      return day.charAt(0).toUpperCase() + day.slice(1);
  }, [currentDate]);


  const filteredClasses = useMemo(() => {
    // No mostrar clases para Sábado o Domingo
    if (selectedDayName === "Sábado" || selectedDayName === "Domingo") return [];

    return allClasses.filter(c => c.day.toLowerCase() === selectedDayName.toLowerCase() && c.time === selectedTime);
  }, [allClasses, selectedDayName, selectedTime]);

  const handleBookingUpdate = (classId: string, newAttendees: Attendee[], newBookings: string[]) => {
      const updatedClasses = allClasses.map(c => c.id === classId ? { ...c, attendees: newAttendees } : c);
      setAllClasses(updatedClasses);
      setUserBookings(newBookings);
      sessionStorage.setItem('allClasses', JSON.stringify(updatedClasses));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card p-4 sm:p-6 rounded-lg shadow-lg text-card-foreground">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <div>
            <p className="text-sm text-muted-foreground">SEMANA DE</p>
            <p className="font-semibold capitalize">{`${format(startOfCurrentWeek, 'd MMM', { locale: es })} - ${format(endOfWeek(startOfCurrentWeek, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`}</p>
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
      />
      
      <TimeSelector
        timeSlots={timeSlots}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />

      <div className="mt-6 flex-1 overflow-y-auto">
        {filteredClasses.length > 0 ? (
          filteredClasses.map(classInfo => (
            <ClassCard 
              key={classInfo.id}
              classInfo={classInfo}
              user={user}
              userBookings={userBookings}
              onBookingUpdate={handleBookingUpdate}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{selectedDayName === "Sábado" || selectedDayName === "Domingo" ? `No hay clases programadas para el ${selectedDayName}.` : "No hay clases para esta selección."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

    