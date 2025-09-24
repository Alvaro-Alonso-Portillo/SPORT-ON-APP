
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Users } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/ui/user-avatar';
import type { ClassInfo, Attendee } from '@/types';
import { cn } from '@/lib/utils';


export default function AdminAttendancePage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClassesForDate = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const classesQuery = query(collection(db, 'classes'), where('date', '==', dateString));
      const querySnapshot = await getDocs(classesQuery);

      const fetchedClasses = querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as ClassInfo))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setClasses(fetchedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las clases para la fecha seleccionada."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/login');
      return;
    }
    if (isSuperAdmin) {
      fetchClassesForDate(selectedDate);
    }
  }, [authLoading, isSuperAdmin, router, selectedDate, fetchClassesForDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAttendanceChange = async (classId: string, attendeeUid: string, hasAttended: boolean) => {
    const newStatus = hasAttended ? 'asistido' : 'reservado';

    try {
        // Find the class and attendee in the local state
        const classToUpdate = classes.find(c => c.id === classId);
        if (!classToUpdate) return;

        const updatedAttendees = classToUpdate.attendees.map(attendee => 
            attendee.uid === attendeeUid ? { ...attendee, status: newStatus } : attendee
        );
        
        // Optimistically update the UI
        setClasses(prevClasses => 
            prevClasses.map(c => c.id === classId ? { ...c, attendees: updatedAttendees } : c)
        );

        // Update Firestore
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, { attendees: updatedAttendees });

        toast({
            title: "Asistencia actualizada",
            description: `Se ha marcado a un asistente como ${newStatus}.`
        });

    } catch (error) {
        console.error("Error updating attendance:", error);
        // Revert UI on error
        fetchClassesForDate(selectedDate);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo actualizar la asistencia."
        });
    }
  };


  if (authLoading || !isSuperAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-4xl font-bold">Gestión de Asistencia</h1>
          <p className="text-muted-foreground text-sm md:text-base">Selecciona una fecha para pasar lista en las clases.</p>
        </div>
        <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
      </div>
      
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center bg-card rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow-sm">
            <p className="text-muted-foreground">No hay clases programadas para este día.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
            {classes.map(classInfo => {
                const classDateTime = parseISO(`${classInfo.date}T${classInfo.time}`);
                const isClassPast = isPast(classDateTime);

                return (
                    <AccordionItem value={classInfo.id} key={classInfo.id}>
                        <AccordionTrigger className="hover:no-underline bg-card p-4 rounded-t-lg border-b">
                           <div className="flex items-center justify-between w-full">
                             <div className="text-left">
                                <p className="font-bold text-lg">{classInfo.name} - {classInfo.time}</p>
                                <p className="text-sm text-muted-foreground">{classInfo.day}</p>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                                <Users className="h-4 w-4" />
                                <span>{classInfo.attendees.length} / {classInfo.capacity}</span>
                             </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 bg-card rounded-b-lg">
                           <div className="space-y-4">
                            {classInfo.attendees.length > 0 ? (
                                classInfo.attendees.map(attendee => (
                                    <div key={attendee.uid} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={attendee} className="h-9 w-9" />
                                            <p className="font-medium">{attendee.name}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`attendance-${classInfo.id}-${attendee.uid}`}
                                                checked={attendee.status === 'asistido'}
                                                onCheckedChange={(checked) => handleAttendanceChange(classInfo.id, attendee.uid, checked)}
                                                disabled={!isClassPast}
                                                aria-readonly={!isClassPast}
                                            />
                                            <Label htmlFor={`attendance-${classInfo.id}-${attendee.uid}`} className={cn(isClassPast ? "text-foreground" : "text-muted-foreground")}>
                                                {attendee.status === 'asistido' ? 'Asistió' : 'Reservado'}
                                            </Label>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground p-4">No hay asistentes en esta clase.</p>
                            )}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      )}

    </div>
  );
}

    