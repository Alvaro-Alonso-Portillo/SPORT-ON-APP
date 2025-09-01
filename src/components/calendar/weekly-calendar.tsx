
"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isBefore, endOfWeek, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import TimeSelector from "./time-selector";
import ClassCard from "./class-card";
import { Button } from "../ui/button";

const timeSlots = [
    "08:00", "09:15", "10:30", "11:45", "13:00", 
    "14:15", "17:00", "18:15", "19:30", "20:45"
];

const generateClassesForDate = (date: Date, existingClasses: ClassInfo[]): ClassInfo[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'eeee', { locale: es });
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // No generar clases para Sábado y Domingo
    if (capitalizedDayName === "Sábado" || capitalizedDayName === "Domingo") return [];

    return timeSlots.map(time => {
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


export default function WeeklyCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const storedClasses = sessionStorage.getItem('allClasses');
      let currentClasses: ClassInfo[] = [];
      if (storedClasses) {
        currentClasses = JSON.parse(storedClasses);
      }
      
      setAllClasses(currentClasses);
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const userBookings = useMemo(() => {
    if (!user) return [];
    return allClasses
        .filter(c => c.attendees.some(a => a.uid === user.uid))
        .map(c => c.id);
  }, [allClasses, user]);


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
    return generateClassesForDate(currentDate, allClasses).filter(c => c.time === selectedTime);
  }, [currentDate, allClasses, selectedTime]);

  const handleBookingUpdate = (classId: string, newAttendees: Attendee[]) => {
      const updatedClasses = [...allClasses];
      const classIndex = updatedClasses.findIndex(c => c.id === classId);
      
      const date = parseISO(classId.substring(0, 10));
      const dayName = format(date, 'eeee', { locale: es });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      const updatedClass: ClassInfo = {
          id: classId,
          name: 'Entrenamiento',
          description: 'Clase de Entrenamiento.',
          time: classId.substring(11, 13) + ':' + classId.substring(13, 15),
          day: capitalizedDayName,
          date: classId.substring(0, 10),
          duration: 75,
          capacity: 24,
          attendees: newAttendees,
      };

      if (classIndex !== -1) {
          // If class exists, update it
          if (newAttendees.length > 0) {
              updatedClasses[classIndex] = updatedClass;
          } else {
              // If no more attendees, remove the class to save space
              updatedClasses.splice(classIndex, 1);
          }
      } else if (newAttendees.length > 0) {
          // If class doesn't exist and has attendees, add it
          updatedClasses.push(updatedClass);
      }

      setAllClasses(updatedClasses);
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
        {selectedDayName === "Sábado" || selectedDayName === "Domingo" ? (
             <div className="text-center py-10">
                <p className="text-muted-foreground">No hay clases programadas para el {selectedDayName}.</p>
             </div>
        ) : filteredClasses.length > 0 ? (
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
            <p className="text-muted-foreground">No hay clases para esta selección.</p>
          </div>
        )}
      </div>
    </div>
  );
}
