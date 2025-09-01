
"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import TimeSelector from "./time-selector";
import ClassCard from "./class-card";

const timeSlots = [
    "08:00", "09:15", "10:30", "11:45", "13:00", 
    "14:15", "17:00", "18:15", "19:30", "20:45"
];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const generateAllPossibleClasses = (): ClassInfo[] => {
  const allClasses: ClassInfo[] = [];
  daysOfWeek.forEach(day => {
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
      
      // Attempt to load class state from sessionStorage
      const storedClasses = sessionStorage.getItem('allClasses');
      if (storedClasses) {
        setAllClasses(JSON.parse(storedClasses));
      } else {
        // If nothing in storage, generate initial state and add mocks
        const generatedClasses = generateAllPossibleClasses();
        generatedClasses[0].attendees.push({uid: 'user-xxx', name: 'Alex'});
        generatedClasses[5].attendees.push({uid: 'user-yyy', name: 'Sara'});
        setAllClasses(generatedClasses);
        sessionStorage.setItem('allClasses', JSON.stringify(generatedClasses));
      }
      
      if (user) {
        // Filter bookings for the current user
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

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const selectedDayName = useMemo(() => {
      const day = format(currentDate, 'eeee', { locale: es });
      // Capitalize the first letter
      return day.charAt(0).toUpperCase() + day.slice(1);
  }, [currentDate]);


  const filteredClasses = useMemo(() => {
    return allClasses.filter(c => c.day.toLowerCase() === selectedDayName.toLowerCase() && c.time === selectedTime);
  }, [allClasses, selectedDayName, selectedTime]);

  const handleBookingUpdate = (classId: string, newAttendees: Attendee[], newBookings: string[]) => {
      const updatedClasses = allClasses.map(c => c.id === classId ? { ...c, attendees: newAttendees } : c);
      setAllClasses(updatedClasses);
      setUserBookings(newBookings);
      // Persist changes to sessionStorage
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
      <div className="flex items-center gap-4 mb-4">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">DÍA</p>
          <p className="font-semibold capitalize">{format(currentDate, 'eeee dd/MM', { locale: es })}</p>
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
            <p className="text-muted-foreground">No hay clases para esta selección.</p>
          </div>
        )}
      </div>
    </div>
  );
}
