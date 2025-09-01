
"use client";

import type { ClassInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface TimeSelectorProps {
  classes: ClassInfo[];
  onTimeSelect: (classInfo: ClassInfo) => void;
  userBookings: string[];
  changingBookingId: string | null;
}

export default function TimeSelector({ classes, onTimeSelect, userBookings, changingBookingId }: TimeSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {classes.map((classInfo) => {
        const isBooked = userBookings.includes(classInfo.id);
        const isFull = classInfo.attendees.length >= classInfo.capacity;
        const isChangingThis = changingBookingId === classInfo.id;
        
        let buttonContent: React.ReactNode = classInfo.time;
        let isDisabled = false;
        let variant: "default" | "secondary" | "outline" = "secondary";
        
        if (changingBookingId) {
            if(isChangingThis) {
                buttonContent = "Actual";
                variant = "outline";
                isDisabled = true;
            } else if (isBooked || isFull) {
                buttonContent = "No disponible";
                variant = "secondary";
                isDisabled = true;
            } else {
                buttonContent = "Mover aquí";
                variant = "default";
            }
        } else {
            if (isBooked) {
                buttonContent = (
                    <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Reservado
                    </>
                );
                variant = "default";
            } else if (isFull) {
                buttonContent = "Completo";
                isDisabled = true;
            }
        }
        
        return (
          <Button
            key={classInfo.id}
            variant={variant}
            disabled={isDisabled}
            className={cn("h-12 text-base font-semibold", {
                "ring-2 ring-primary ring-offset-2": isChangingThis
            })}
            onClick={() => onTimeSelect(classInfo)}
          >
            {buttonContent}
          </Button>
        );
      })}
    </div>
  );
}
