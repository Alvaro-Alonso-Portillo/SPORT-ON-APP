
"use client";

import * as React from "react";
import { useRef, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from '@/components/ui/button';

interface TimeSelectorProps {
  timeSlots: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export default function TimeSelector({ timeSlots, selectedTime, onTimeSelect }: TimeSelectorProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const timeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (api) {
      const selectedIndex = timeSlots.findIndex(t => t === selectedTime);
      if (selectedIndex !== -1) {
        api.scrollTo(selectedIndex);
      }
    }
  }, [selectedTime, api, timeSlots]);


  return (
    <div className="relative border-y border-border py-4 overflow-hidden">
       <Carousel setApi={setApi} opts={{ align: "start", slidesToScroll: 3, dragFree: true }}>
        <CarouselContent className="-ml-2">
          {timeSlots.map((time, index) => (
            <CarouselItem key={index} className="basis-1/4 sm:basis-1/5 md:basis-1/5 lg:basis-[12%] pl-2">
              <Button
                ref={el => timeRefs.current[index] = el}
                variant={selectedTime === time ? "default" : "secondary"}
                className="w-full rounded-full"
                onClick={() => onTimeSelect(time)}
              >
                {time}
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
      </Carousel>
    </div>
  );
}
