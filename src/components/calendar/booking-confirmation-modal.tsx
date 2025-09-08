
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ClassInfo, Attendee } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BookingConfirmationModalProps {
  classInfo: ClassInfo;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (classInfo: ClassInfo, newAttendee: Attendee) => Promise<void>;
  user: User | null;
}

export default function BookingConfirmationModal({ classInfo, isOpen, onClose, onConfirm, user }: BookingConfirmationModalProps) {
  const [isBooking, setIsBooking] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setIsBooking(true);
    
    try {
        const newAttendee: Attendee = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || "Usuario",
            photoURL: user.photoURL || undefined
        };
        await onConfirm(classInfo, newAttendee);
    } finally {
        setIsBooking(false);
    }
  };

  const formattedDate = format(new Date(classInfo.date.replace(/-/g, '/')), "eeee, d 'de' MMMM", { locale: es });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
          <DialogDescription>
            Estás a punto de reservar tu plaza para <strong>{classInfo.name}</strong> el <span className="capitalize">{formattedDate}</span> a las <strong>{classInfo.time}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBooking}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isBooking}>
            {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
