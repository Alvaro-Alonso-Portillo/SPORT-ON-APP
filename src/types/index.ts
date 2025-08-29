export interface ClassInfo {
  id: string;
  name: string;
  instructor: string;
  description: string;
  time: string;
  day: string;
  duration: number;
  capacity: number;
  attendees: string[];
}

export interface Booking {
  id: string;
  userId: string;
  classId: string;
  classInfo?: ClassInfo;
}
