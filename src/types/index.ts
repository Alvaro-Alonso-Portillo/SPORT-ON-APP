
import type { Timestamp } from "firebase/firestore";

export interface Attendee {
  uid: string;
  name: string;
  photoURL?: string;
}

export interface ClassInfo {
  id: string; // Will now be in 'YYYY-MM-DD-HHmm' format
  name: string;
  description: string;
  time: string;
  day: string; // Day of the week name, e.g., "Lunes"
  date: string; // Full date in 'YYYY-MM-DD' format
  duration: number;
  capacity: number;
  attendees: Attendee[]; 
}

export interface Booking {
  id: string;
  userId: string;
  classId: string;
  classInfo?: ClassInfo;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    createdAt: Date | Timestamp;
    dob?: Date | Timestamp;
    bio?: string;
    photoURL?: string;
}
