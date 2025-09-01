
"use client";

import type { ClassInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface TimeSelectorProps {
  classes: ClassInfo[];
  onTimeSelect: (classInfo: ClassInfo) => void;
  userBookings: string[];
  changingBookingId: string | null;
}

export default function TimeSelector({ classes, onTimeSelect, userBookings, changingBookingId }: TimeSelectorProps) {
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
                        <CarouselItem key={classInfo.id} className="basis-1/3 md:basis-1/4 lg:basis-1/5 pl-2">
                            <Button
                                variant={variant}
                                disabled={isDisabled}
                                className={cn("w-full h-12 text-base font-semibold rounded-full", {
                                    "ring-2 ring-primary ring-offset-2": isChangingThis
                                })}
                                onClick={() => onTimeSelect(classInfo)}
                            >
                                {buttonContent}
                            </Button>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-1rem] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
            <CarouselNext className="absolute right-[-1rem] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        </Carousel>
    </div>
  );
}
