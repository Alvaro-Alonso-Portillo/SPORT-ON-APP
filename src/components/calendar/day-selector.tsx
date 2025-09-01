
"use client";

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DaySelectorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  weekDates: Date[];
  isDateDisabled: (date: Date) => boolean;
}

export default function DaySelector({ currentDate, setCurrentDate, weekDates, isDateDisabled }: DaySelectorProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((day, index) => (
        <Button
          key={index}
          variant={isSameDay(day, currentDate) ? "default" : "secondary"}
          className="w-full h-20 flex flex-col items-center justify-center gap-1 rounded-lg text-xs md:text-sm p-1"
          onClick={() => setCurrentDate(day)}
          disabled={isDateDisabled(day)}
        >
          <span className="capitalize font-light">{format(day, 'eee', { locale: es })}</span>
          <span className="text-xl md:text-2xl font-bold">{format(day, 'd', { locale: es })}</span>
        </Button>
      ))}
    </div>
  );
}
