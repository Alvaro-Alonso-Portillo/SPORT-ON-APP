import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { useAuth } from "@/hooks/use-auth";
import Welcome from "@/components/layout/welcome";

export default function Home() {
  return (
    <div className="h-full w-full">
      <WeeklyCalendar />
    </div>
  );
}
