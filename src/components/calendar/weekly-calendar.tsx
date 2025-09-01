
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { ClassInfo, Attendee } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isBefore, subDays, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

import DaySelector from "./day-selector";
import TimeSelector from "./time-selector";
import ClassCard from "./class-card";
import { Button } from "../ui/button";

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


export default function WeeklyCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const classCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const storedClasses = sessionStorage.getItem('allClasses');
      const currentClasses: ClassInfo[] = storedClasses ? JSON.parse(storedClasses) : [];
      
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

  const formattedSelectedDate = useMemo(() => {
    if (isToday(currentDate)) {
      return `Hoy, ${format(currentDate, 'd MMMM', { locale: es })}`;
    }
    if (isTomorrow(currentDate)) {
      return `Mañana, ${format(currentDate, 'eeee, d MMMM', { locale: es })}`;
    }
    return format(currentDate, 'eeee, d MMMM', { locale: es });
  }, [currentDate]);


  const dailyClasses = useMemo(() => {
    return generateClassesForDate(currentDate, allClasses);
  }, [currentDate, allClasses]);
  
  const timeSlots = useMemo(() => {
    return dailyClasses.map(c => c.time);
  }, [dailyClasses]);
  
  const [selectedTime, setSelectedTime] = useState(timeSlots[0] || "");

  useEffect(() => {
    if (timeSlots.length > 0) {
        setSelectedTime(timeSlots[0]);
    }
  }, [timeSlots]);

  // Scroll Spy Logic
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (isScrolling) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const time = entry.target.getAttribute('data-time');
          if (time) {
            setSelectedTime(time);
          }
        }
      });
    };
    
    observer.current = new IntersectionObserver(handleIntersect, {
      root: scrollContainerRef.current,
      rootMargin: '-50% 0px -50% 0px', // Center of the viewport
      threshold: 0,
    });

    const currentObserver = observer.current;
    Object.values(classCardRefs.current).forEach(el => {
      if (el) currentObserver.observe(el);
    });

    return () => {
      currentObserver.disconnect();
    };
  }, [dailyClasses, isScrolling]);


  const handleTimeSelect = useCallback((time: string) => {
    setIsScrolling(true);
    setSelectedTime(time);
    const targetRef = classCardRefs.current[time];
    if (targetRef) {
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Set a timeout to re-enable observer after scroll animation
    setTimeout(() => setIsScrolling(false), 1000);
  }, []);


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
          if (newAttendees.length > 0) {
              updatedClasses[classIndex] = updatedClass;
          } else {
              updatedClasses.splice(classIndex, 1);
          }
      } else if (newAttendees.length > 0) {
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
        />
        
        <TimeSelector
          timeSlots={timeSlots}
          selectedTime={selectedTime}
          onTimeSelect={handleTimeSelect}
        />
      </div>

      <div ref={scrollContainerRef} className="mt-6 flex-1 overflow-y-auto scroll-smooth p-4 md:p-0">
        {selectedDayName === "Sábado" || selectedDayName === "Domingo" ? (
             <div className="text-center py-10">
                <p className="text-muted-foreground">No hay clases programadas para el {selectedDayName}.</p>
             </div>
        ) : dailyClasses.length > 0 ? (
          dailyClasses.map(classInfo => (
            <div 
              key={classInfo.id} 
              ref={el => classCardRefs.current[classInfo.time] = el}
              data-time={classInfo.time}
              className="mb-4"
            >
              <ClassCard 
                classInfo={classInfo}
                user={user}
                userBookings={userBookings}
                onBookingUpdate={handleBookingUpdate}
                dailyClasses={dailyClasses}
                onTimeSelect={handleTimeSelect}
              />
            </div>
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

