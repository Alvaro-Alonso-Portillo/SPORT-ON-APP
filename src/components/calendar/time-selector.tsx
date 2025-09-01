
"use client";

import type { ClassInfo } from "@/types";
import { Button } from "@/components/ui/button";

interface TimeSelectorProps {
  dailyClasses: ClassInfo[];
}

// A simple script to hide the scrollbar but keep the functionality
const scrollbarHide = {
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '-ms-overflow-style': 'none', /* IE and Edge */
  'scrollbar-width': 'none', /* Firefox */
};

export default function TimeSelector({ dailyClasses }: TimeSelectorProps) {
  if (!dailyClasses || dailyClasses.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto whitespace-nowrap py-2 scrollbar-hide">
      <div className="flex items-center gap-2">
        {dailyClasses.map((classInfo) => (
          <a key={classInfo.id} href={`#class-${classInfo.time.replace(':', '')}`}>
            <Button variant="outline" size="sm">
              {classInfo.time}
            </Button>
          </a>
        ))}
      </div>
    </div>
  );
}
