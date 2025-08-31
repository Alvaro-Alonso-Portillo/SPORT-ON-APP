
"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ClassInfo } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2, PlusCircle, MinusCircle, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const timeSlots = [
    "08:00 - 09:15",
    "09:15 - 10:30",
    "10:30 - 11:45",
    "11:45 - 13:00",
    "13:00 - 14:15",
    "14:15 - 15:30",
    "17:00 - 18:15",
    "18:15 - 19:30",
    "19:30 - 20:45",
    "20:45 - 22:00"
];

const generateAllPossibleClasses = (): ClassInfo[] => {
  const allClasses: ClassInfo[] = [];
  daysOfWeek.forEach(day => {
    timeSlots.forEach(time => {
      const timeStart = time.split(' - ')[0];
      const classId = `${day.toLowerCase().substring(0,3)}-${timeStart.replace(':', '')}`;
      allClasses.push({
        id: classId,
        name: 'Entrenamiento',
        description: 'Clase de Entrenamiento.',
        time: timeStart,
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
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const [usersInfo, setUsersInfo] = useState<{[key: string]: string}>({});

  const classesMap = useMemo(() => {
    const map = new Map<string, ClassInfo>();
    classes.forEach(c => map.set(`${c.day}-${c.time}`, c));
    return map;
  }, [classes]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 500));
      setClasses(generateAllPossibleClasses()); 
      if (user) {
        setUserBookings([]);
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
      setClasses(prevClasses => prevClasses.map(c => 
        c.id === selectedClass.id ? { ...c, attendees: [...c.attendees, user.uid] } : c
      ));
    }
    setIsBooking(false);
    setIsModalOpen(false);
  };

  const handleCancelBooking = async () => {
    setIsBooking(true);
    await new Promise(res => setTimeout(res, 1000));
    if (selectedClass) {
      setUserBookings(prev => prev.filter(id => id !== selectedClass.id));
      setClasses(prevClasses => prevClasses.map(c => 
        c.id === selectedClass.id ? { ...c, attendees: c.attendees.filter(uid => uid !== user?.uid) } : c
      ));
    }
    setIsBooking(false);
    setIsModalOpen(false);
  }

  const getWeekDateRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = addDays(start, 4);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const startDate = start.toLocaleDateString('es-ES', options);
    const endDate = end.toLocaleDateString('es-ES', { ...options, year: 'numeric' });
    return `${format(start, 'MMMM yyyy', { locale: es })}`;
  };

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
  }, [currentWeek]);


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-gray-800 capitalize">{getWeekDateRange(currentWeek)}</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Selecciona una clase para reservar</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
      </div>
      
      {!user && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>¡Bienvenido!</AlertTitle>
          <AlertDescription>
            Por favor, <Link href="/login" className="font-bold underline text-primary">inicia sesión</Link> o <Link href="/signup" className="font-bold underline text-primary">regístrate</Link> para reservar clases.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto flex-1">
        <div className="grid grid-cols-[80px_repeat(5,minmax(120px,1fr))] min-w-[680px]">
          <div className="p-2 text-center font-semibold bg-primary text-primary-foreground border-b border-r border-primary/20 sticky left-0 z-10">Horario</div>
          {daysOfWeek.map((day, index) => (
            <div key={day} className="p-2 text-center font-semibold bg-primary text-primary-foreground border-b border-r border-primary/20 text-xs sm:text-sm md:text-base capitalize">
              <span className="md:hidden">{format(weekDates[index], 'eee', { locale: es })} </span>
              <span className="hidden md:inline">{format(weekDates[index], 'eeee', { locale: es })} </span> 
              {format(weekDates[index], 'd', { locale: es })}
            </div>
          ))}

          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              <div className={cn("p-1 h-16 sm:h-20 flex items-center justify-center text-xs md:text-sm text-gray-700 border-r border-gray-200 bg-primary/10 sticky left-0 z-10", timeIndex < timeSlots.length - 1 ? "border-b" : "")}>
                {time.split(' - ')[0]}
              </div>
              {daysOfWeek.map((day, dayIndex) => {
                const classTime = time.split(' - ')[0];
                const classInfo = classesMap.get(`${day}-${classTime}`);
                const isBookedByUser = user && classInfo && userBookings.includes(classInfo.id);

                return (
                  <div key={day} className={cn("p-1 border-r border-gray-200 h-16 sm:h-20", timeIndex < timeSlots.length - 1 ? "border-b" : "", dayIndex === daysOfWeek.length - 1 ? "border-r-0" : "")}>
                    {classInfo ? (
                      <button
                        onClick={() => handleClassClick(classInfo)}
                        disabled={!user || (classInfo.attendees.length >= classInfo.capacity && !isBookedByUser)}
                        className={cn(
                          "w-full h-full rounded-md p-1 text-left transition-all text-[10px] sm:text-xs md:text-sm flex flex-col justify-between items-center text-center group",
                          isBookedByUser ? "bg-accent/80 text-accent-foreground font-semibold" : "bg-white hover:bg-gray-100",
                          (!user || (classInfo.attendees.length >= classInfo.capacity && !isBookedByUser)) && "opacity-50 cursor-not-allowed bg-gray-100",
                        )}
                      >
                         <div className="w-full"></div>
                         {isBookedByUser ? (
                            <span className="font-bold">{user?.displayName || user?.email?.split('@')[0]}</span>
                         ) : (
                            <Plus className="h-4 w-4 text-gray-400 group-hover:scale-125 group-hover:text-primary transition-transform" />
                         )}
                         <div className="w-full flex justify-end items-center gap-1 text-gray-500">
                           <Users className="h-3 w-3" />
                           <span>{classInfo.attendees.length}/{classInfo.capacity}</span>
                         </div>
                      </button>
                    ) : (
                      <div className="w-full h-full bg-gray-50 rounded-md"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          {selectedClass ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-xl md:text-2xl">{selectedClass.name}</DialogTitle>
                <DialogDescription>
                  {format(weekDates[daysOfWeek.indexOf(selectedClass.day)], 'eeee d \'de\' MMMM', { locale: es })} a las {selectedClass.time}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <p>Plazas restantes: {selectedClass.capacity - selectedClass.attendees.length}</p>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cerrar</Button>
                {user && (userBookings.includes(selectedClass.id) ? (
                  <Button variant="destructive" onClick={handleCancelBooking} disabled={isBooking} className="w-full sm:w-auto">
                    {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Reserva
                  </Button>
                ) : (
                  <Button onClick={handleBooking} disabled={isBooking || (selectedClass.capacity - selectedClass.attendees.length <= 0)} className="w-full sm:w-auto">
                    {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reservar Ahora
                  </Button>
                ))}
                {!user && (
                    <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
                        Iniciar Sesión para Reservar
                    </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Nueva Reserva</DialogTitle>
                <DialogDescription>
                  Selecciona una clase del calendario para reservar.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
