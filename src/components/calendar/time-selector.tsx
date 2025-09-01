
"use client";

import * as React from "react";
import type { User } from 'firebase/auth';
import type { ClassInfo } from '@/types';
import { Users, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  dailyClasses: ClassInfo[];
  onTimeSelect: (classInfo: ClassInfo) => void;
  userBookings: string[];
  user: User | null;
  changingBookingId: string | null;
}

export default function TimeSelector({ dailyClasses, onTimeSelect, userBookings, user, changingBookingId }: TimeSelectorProps) {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {dailyClasses.map((classInfo) => {
        const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
        const isFull = classInfo.attendees.length >= classInfo.capacity;
        const isDisabledByChange = changingBookingId !== null && (isFull || isBookedByUser);
        const isChangingThis = changingBookingId !== null && isBookedByUser;

        return (
          <Button
            key={classInfo.id}
            variant={isBookedByUser ? "default" : "secondary"}
            className={cn(
              "h-24 flex flex-col justify-between items-start p-3 text-left relative overflow-hidden transition-all duration-300",
              isBookedByUser && !isChangingThis && "ring-2 ring-primary ring-offset-2",
              isChangingThis && "ring-2 ring-amber-500 ring-offset-2 animate-pulse",
              changingBookingId && !isDisabledByChange && "hover:scale-105 hover:bg-green-200",
              isDisabledByChange && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => onTimeSelect(classInfo)}
            disabled={isDisabledByChange}
          >
            <div className="w-full flex justify-between items-center">
                <span className="text-2xl font-bold">{classInfo.time}</span>
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-background/20">
                    <Users className="h-3 w-3" />
                    <span>{classInfo.attendees.length}/{classInfo.capacity}</span>
                </div>
            </div>
            <div className="text-xs font-semibold">
                {changingBookingId ? (
                    isDisabledByChange ? (isFull ? "Completo" : "Reservado") : "Disponible"
                ) : (
                    isBookedByUser ? "Reservado" : isFull ? "Completo" : "Disponible"
                )}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
