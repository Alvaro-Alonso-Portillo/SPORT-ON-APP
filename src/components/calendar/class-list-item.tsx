"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee, UserProfile } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Users, Loader2, Trash2, Pencil, UserPlus, ChevronDown, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { isBefore, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import UserProfileModal from '@/components/profile/user-profile-modal';
import AdminBookingModal from './admin-booking-modal';
import { useAuth } from '@/hooks/use-auth';
import UserAvatar from '../ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ClassListItemProps {
  classInfo: ClassInfo;
  user: User | null;
  isBookedByUser: boolean;
  onBookingUpdate: (classInfo: ClassInfo, newAttendee: Omit<Attendee, 'status'> | null, oldClassId?: string, attendeeToUpdate?: Attendee) => Promise<void>;
  changingBooking: { classId: string, attendee: Attendee } | null;
  setChangingBooking: (booking: { classId: string, attendee: Attendee } | null) => void;
}

export default function ClassListItem({ classInfo, user, isBookedByUser, onBookingUpdate, changingBooking, setChangingBooking }: ClassListItemProps) {
  const { isSuperAdmin } = useAuth();
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State for modals
  const [selectedAttendeeForProfile, setSelectedAttendeeForProfile] = useState<Attendee | null>(null);
  const [selectedAttendeeForAction, setSelectedAttendeeForAction] = useState<Attendee | null>(null);
  const [attendeeToRemove, setAttendeeToRemove] = useState<Attendee | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // --- Date & Business Logic ---
  const classDateTime = parse(`${classInfo.date} ${classInfo.time}`, 'yyyy-MM-dd HH:mm', new Date());
  const isPastClass = isBefore(classDateTime, new Date());
  const isBookingAllowed = !isPastClass;

  const freeSlots = Math.max(0, classInfo.capacity - classInfo.attendees.length);
  const isFull = classInfo.attendees.length >= classInfo.capacity;

  const handleBookClass = async (selectedUser?: UserProfile) => {
    const currentUser = user;
    if (!currentUser || !isBookingAllowed) return;

    if (isSuperAdmin && !selectedUser && !changingBooking) {
      setIsBookingModalOpen(true);
      return;
    }
    
    setIsBooking(true);
    
    const isBookingForOther = isSuperAdmin && selectedUser;
    const userForBooking = isBookingForOther ? selectedUser : currentUser;

    if (!userForBooking) {
      setIsBooking(false);
      return;
    }
    
    const displayName = isBookingForOther ? selectedUser.name : currentUser.displayName;
    
    const newAttendee: Omit<Attendee, 'status'> = {
      uid: userForBooking.uid,
      name: displayName || userForBooking.email?.split('@')[0] || "Usuario",
      ...(userForBooking.photoURL && { photoURL: userForBooking.photoURL }),
    };

    try {
      if (changingBooking) {
        await onBookingUpdate(classInfo, newAttendee, changingBooking.classId, changingBooking.attendee);
        setChangingBooking(null);
      } else {
        await onBookingUpdate(classInfo, newAttendee);
      }
    } finally {
      setIsBooking(false);
      setIsBookingModalOpen(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!user || !isBookingAllowed) return;
    setIsCancelling(true);
    const attendeeToRemove = classInfo.attendees.find(a => a.uid === user.uid);
    if(attendeeToRemove) {
      await onBookingUpdate(classInfo, null, undefined, attendeeToRemove);
    }
    setIsCancelling(false);
    setShowCancelConfirm(false);
  };
  
  const handleAdminRemoveBooking = async () => {
    if (!attendeeToRemove) return;
    setIsCancelling(true);
    await onBookingUpdate(classInfo, null, undefined, attendeeToRemove);
    setIsCancelling(false);
    setAttendeeToRemove(null);
  };

  const handleStartChange = (attendeeToChange: Attendee) => {
    setChangingBooking({
      classId: classInfo.id,
      attendee: attendeeToChange,
    });
    setSelectedAttendeeForAction(null);
  };

  const handleOpenAdminActionModal = (attendee: Attendee) => {
    if (isSuperAdmin) {
      setSelectedAttendeeForAction(attendee);
    } else {
      setSelectedAttendeeForProfile(attendee);
    }
  };

  const renderButtons = () => {
    if (isPastClass) {
      return <Button variant="secondary" size="sm" disabled className="h-8 text-xs font-semibold">Finalizada</Button>;
    }
    
    const isChangingThisClass = changingBooking?.classId === classInfo.id;
    const isCurrentUserBeingChanged = isBookedByUser && isChangingThisClass;
    const isOtherUserBeingChanged = !!changingBooking && changingBooking.attendee.uid !== user?.uid;

    if (changingBooking && !isChangingThisClass) {
      if (isFull) return <Button variant="secondary" size="sm" disabled className="h-8 text-xs">Completo</Button>;
      return (
        <Button size="sm" onClick={() => handleBookClass()} disabled={!isBookingAllowed} className="h-8 text-xs">
          {isBooking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Moviendo...</> : "Mover aquí"}
        </Button>
      );
    }

    if (isBookedByUser) {
      const currentUserAttendee = classInfo.attendees.find(a => a.uid === user!.uid);
      return (
        <div className="flex items-center gap-1.5">
          <Button 
            onClick={isCurrentUserBeingChanged ? () => setChangingBooking(null) : () => currentUserAttendee && handleStartChange(currentUserAttendee)} 
            variant={isCurrentUserBeingChanged ? "ghost" : "outline"} 
            size="sm"
            disabled={isBooking || isCancelling || (!!changingBooking && !isCurrentUserBeingChanged) || !isBookingAllowed} 
            className="h-8 text-xs"
          >
            {isCurrentUserBeingChanged ? "Cancelar cambio" : "Cambiar"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowCancelConfirm(true)} 
            disabled={isBooking || isCancelling || !!changingBooking || !isBookingAllowed}
            className="h-8 text-xs"
          >
            Cancelar
          </Button>
        </div>
      );
    }
    
    if (isSuperAdmin && isOtherUserBeingChanged) {
      if (isFull) {
        return <Button variant="secondary" size="sm" disabled className="h-8 text-xs">Completo</Button>;
      }
      return (
        <Button size="sm" onClick={() => handleBookClass()} disabled={isBooking || !isBookingAllowed} className="h-8 text-xs">
          {isBooking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Moviendo...</> : "Mover aquí"}
        </Button>
      );
    }

    if (isFull) {
      return <Button variant="secondary" size="sm" disabled className="h-8 text-xs font-semibold">Completo</Button>;
    }

    return (
      <Button 
        onClick={() => handleBookClass()} 
        disabled={isBooking || !!changingBooking || !isBookingAllowed}
        size="sm"
        className="h-8 px-4 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
      >
        {isBooking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Reservando...</> : "Reservar"}
      </Button>
    );
  };

  return (
    <>
      <div 
        id={`class-${classInfo.time.replace(':', '')}`} 
        className={cn(
          "w-full bg-card rounded-xl border shadow-xs transition-all",
          isBookedByUser ? "border-primary/60 bg-primary/[0.02]" : "hover:border-border/80"
        )}
      >
        {/* FILA PRINCIPAL COMPACTA */}
        <div className="flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3">
          {/* Lado izquierdo: Hora, badges y asistentes */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                {classInfo.time}
              </span>

              {freeSlots > 0 ? (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-md">
                  {freeSlots} plazas libres
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-[11px] font-medium px-2 py-0.5 rounded-md">
                  Completo
                </Badge>
              )}

              {isBookedByUser && (
                <Badge className="bg-primary/15 text-primary border border-primary/30 text-[11px] font-medium px-2 py-0.5">
                  <Check className="h-3 w-3 mr-1" /> Tu reserva
                </Badge>
              )}
            </div>

            {/* Subtítulo: Compañeros apuntados con stack de avatares */}
            {classInfo.attendees.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <button 
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium group"
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {classInfo.attendees.length} {classInfo.attendees.length === 1 ? "compañero apuntado" : "compañeros apuntados"}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>

                {/* Stack de avatares solapados */}
                <div className="flex -space-x-1.5 overflow-hidden ml-1">
                  {classInfo.attendees.slice(0, 4).map((att) => (
                    <UserAvatar 
                      key={att.uid} 
                      user={att} 
                      className="inline-block h-5 w-5 rounded-full ring-1.5 ring-background" 
                    />
                  ))}
                  {classInfo.attendees.length > 4 && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[9px] font-semibold ring-1.5 ring-background text-muted-foreground">
                      +{classInfo.attendees.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lado derecho: Botones de Acción */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {renderButtons()}

            {/* Botón rápido de Admin para añadir alumno */}
            {isSuperAdmin && !isPastClass && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsBookingModalOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:border-primary/50"
                title="Añadir alumno manualmente"
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* SECCIÓN DESPLEGABLE: Lista de Alumnos Apuntados */}
        {isExpanded && classInfo.attendees.length > 0 && (
          <div className="border-t bg-muted/20 p-3 sm:p-4 rounded-b-xl animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-3 gap-x-2 sm:gap-4">
              {classInfo.attendees.map((attendee) => (
                <div 
                  key={attendee.uid}
                  className="relative group flex flex-col items-center text-center"
                >
                  <button 
                    type="button"
                    onClick={() => handleOpenAdminActionModal(attendee)}
                    className="relative rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform active:scale-95 group-hover:scale-105"
                    title={isSuperAdmin ? `Gestionar reserva de ${attendee.name}` : attendee.name}
                  >
                    <UserAvatar 
                      user={attendee} 
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl text-sm sm:text-base font-bold shadow-xs border border-border/50" 
                    />

                    {/* Indicador sutil para admin en móvil */}
                    {isSuperAdmin && (
                      <span className="sm:hidden absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border shadow-xs text-muted-foreground">
                        <Pencil className="h-2.5 w-2.5" />
                      </span>
                    )}

                    {/* Acciones flotantes de Admin en desktop / hover */}
                    {isSuperAdmin && (
                      <div className="absolute -top-1.5 -right-1.5 hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-xs rounded-full p-0.5 z-10">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChange(attendee);
                          }}
                          className="p-1 hover:text-primary rounded-full hover:bg-muted cursor-pointer"
                          title="Modificar"
                        >
                          <Pencil className="h-3 w-3" />
                        </span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttendeeToRemove(attendee);
                          }}
                          className="p-1 hover:text-destructive rounded-full hover:bg-muted cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </button>

                  <span 
                    className="text-xs font-medium text-foreground mt-1.5 truncate max-w-[70px] sm:max-w-[82px] text-center"
                    title={attendee.name}
                  >
                    {attendee.name}
                  </span>
                </div>
              ))}

              {/* Botón rápido en la cuadrícula para que el admin añada alumno si hay plazas */}
              {isSuperAdmin && !isPastClass && freeSlots > 0 && (
                <div className="flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-primary/70 hover:text-primary transition-all active:scale-95"
                    title="Añadir alumno manualmente"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground mt-1.5 truncate max-w-[70px]">
                    Añadir
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modales existentes */}
      <UserProfileModal 
        attendee={selectedAttendeeForProfile}
        isOpen={!!selectedAttendeeForProfile}
        onClose={() => setSelectedAttendeeForProfile(null)}
      />

      {selectedAttendeeForAction && (
        <Dialog open={!!selectedAttendeeForAction} onOpenChange={() => setSelectedAttendeeForAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionar a {selectedAttendeeForAction.name}</DialogTitle>
              <DialogDescription>
                Selecciona una acción para la reserva de este cliente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="grid grid-cols-2 gap-4 pt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  setAttendeeToRemove(selectedAttendeeForAction);
                  setSelectedAttendeeForAction(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Reserva
              </Button>
              <Button
                onClick={() => handleStartChange(selectedAttendeeForAction)}
              >
                <Pencil className="mr-2 h-4 w-4" /> Modificar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cancelará permanentemente tu reserva para las {classInfo.time}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling}>
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!attendeeToRemove} onOpenChange={(open) => !open && setAttendeeToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación (Admin)</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la reserva de <strong>{attendeeToRemove?.name}</strong> de la clase a las {classInfo.time}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} onClick={() => setAttendeeToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminRemoveBooking} disabled={isCancelling} className={buttonVariants({ variant: "destructive" })}>
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, Eliminar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isSuperAdmin && (
        <AdminBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onConfirm={handleBookClass}
        />
      )}
    </>
  );
}