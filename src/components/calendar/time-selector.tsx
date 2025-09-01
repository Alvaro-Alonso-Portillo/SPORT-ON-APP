
"use client";

import * as React from "react";
import type { User } from 'firebase/auth';
import type { ClassInfo } from '@/types';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  dailyClasses: ClassInfo[];
  onTimeSelect: (classInfo: ClassInfo) => void;
  userBookings: string[];
  user: User | null;
}

export default function TimeSelector({ dailyClasses, onTimeSelect, userBookings, user }: TimeSelectorProps) {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {dailyClasses.map((classInfo) => {
        const isBookedByUser = user ? userBookings.includes(classInfo.id) : false;
        const isFull = classInfo.attendees.length >= classInfo.capacity;
        const isDisabled = isFull && !isBookedByUser;

        return (
          <Button
            key={classInfo.id}
            variant={isBookedByUser ? "default" : "secondary"}
            className={cn(
              "h-24 flex flex-col justify-between items-start p-3 text-left relative overflow-hidden",
              isBookedByUser && "ring-2 ring-primary ring-offset-2",
              isFull && !isBookedByUser && "bg-muted text-muted-foreground",
            )}
            onClick={() => onTimeSelect(classInfo)}
            disabled={isDisabled}
          >
            <div className="w-full flex justify-between items-center">
                <span className="text-2xl font-bold">{classInfo.time}</span>
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-background/20">
                    <Users className="h-3 w-3" />
                    <span>{classInfo.attendees.length}/{classInfo.capacity}</span>
                </div>
            </div>
            <div className="text-xs">
                {isBookedByUser ? "Reservado" : isFull ? "Completo" : "Disponible"}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
