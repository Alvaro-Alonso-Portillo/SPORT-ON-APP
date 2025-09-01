
"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from '@/components/ui/button';

interface TimeSelectorProps {
  timeSlots: string[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
}

export default function TimeSelector({ timeSlots, selectedTime, setSelectedTime }: TimeSelectorProps) {
  return (
    <div className="relative border-y border-border py-4">
       <Carousel opts={{ align: "start", slidesToScroll: 3, dragFree: true }}>
        <CarouselContent className="-ml-2">
          {timeSlots.map((time, index) => (
            <CarouselItem key={index} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-[12%] pl-2">
              <Button
                variant={selectedTime === time ? "default" : "outline"}
                className="w-full rounded-full"
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
      </Carousel>
    </div>
  );
}
