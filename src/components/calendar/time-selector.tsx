
"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button";
import type { ClassInfo } from "@/types";

interface TimeSelectorProps {
  classes: ClassInfo[];
}

export default function TimeSelector({ classes }: TimeSelectorProps) {
  
  const handleTimeClick = (time: string) => {
    const classId = `class-${time.replace(':', '')}`;
    const element = document.getElementById(classId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          {classes.map((classInfo) => (
            <CarouselItem key={classInfo.id} className="basis-1/4 md:basis-1/5 lg:basis-1/7 pl-2">
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => handleTimeClick(classInfo.time)}
              >
                <span className="text-lg font-bold">{classInfo.time}</span>
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
