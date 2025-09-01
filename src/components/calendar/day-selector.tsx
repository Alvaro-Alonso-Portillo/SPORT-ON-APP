
"use client";

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClassInfo } from '@/types';

interface DaySelectorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  weekDates: Date[];
  isDateDisabled: (date: Date) => boolean;
}

export default function DaySelector({ currentDate, setCurrentDate, weekDates, isDateDisabled }: DaySelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex w-full space-x-2 md:space-x-4">
        {weekDates.map((day, index) => (
          <Button
            key={index}
            variant={isSameDay(day, currentDate) ? "default" : "secondary"}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg"
            onClick={() => setCurrentDate(day)}
            disabled={isDateDisabled(day)}
          >
            <span className="text-sm capitalize font-light">{format(day, 'eee', { locale: es })}</span>
            <span className="text-xl font-bold">{format(day, 'd', { locale: es })}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
