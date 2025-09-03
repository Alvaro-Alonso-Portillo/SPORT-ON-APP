
"use client";

import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { useAuth } from "@/hooks/use-auth";
import Welcome from "@/components/layout/welcome";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Welcome />;
  }
  
  if (!user) {
      return <Welcome />;
  }

  return (
    <div className="h-full w-full p-4 md:p-8">
      <WeeklyCalendar />
    </div>
  );
}
