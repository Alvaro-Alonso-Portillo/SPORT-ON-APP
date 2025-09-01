
"use client";

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

export default function DaySelector({ currentDate, setCurrentDate, weekDates }: DaySelectorProps) {
  return (
    <div className="relative mb-4">
      <Carousel opts={{ align: "start", slidesToScroll: 1, dragFree: true }}>
        <CarouselContent className="-ml-2">
          {weekDates.map((day, index) => (
            <CarouselItem key={index} className="basis-1/5 sm:basis-1/7 md:basis-[12%] pl-2">
              <Button
                variant={isSameDay(day, currentDate) ? "default" : "outline"}
                className="w-full h-16 flex flex-col gap-1"
                onClick={() => setCurrentDate(day)}
              >
                <span className="text-xs capitalize font-light">{format(day, 'eee', { locale: es })}</span>
                <span className="text-lg font-bold">{format(day, 'd', { locale: es })}</span>
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  );
}
