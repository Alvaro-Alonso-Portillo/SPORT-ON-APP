
"use client";

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface DaySelectorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  weekDates: Date[];
  isDateDisabled: (date: Date) => boolean;
}

export default function DaySelector({ currentDate, setCurrentDate, weekDates, isDateDisabled }: DaySelectorProps) {
  return (
    <div className="relative w-full">
       <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
       >
        <CarouselContent className="-ml-2">
          {weekDates.map((day, index) => (
            <CarouselItem key={index} className="basis-1/4 md:basis-1/5 lg:basis-1/7 pl-2">
              <Button
                variant={isSameDay(day, currentDate) ? "default" : "secondary"}
                className="w-full h-20 flex flex-col items-center justify-center gap-2 rounded-lg"
                onClick={() => setCurrentDate(day)}
                disabled={isDateDisabled(day)}
              >
                <span className="text-sm capitalize font-light">{format(day, 'eee', { locale: es })}</span>
                <span className="text-2xl font-bold">{format(day, 'd', { locale: es })}</span>
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-1rem] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-[-1rem] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
       </Carousel>
    </div>
  );
}
