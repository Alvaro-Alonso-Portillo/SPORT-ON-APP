
export interface Attendee {
  uid: string;
  name: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  description: string;
  time: string;
  day: string;
  duration: number;
  capacity: number;
  attendees: Attendee[]; // Array of Attendee objects
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
    createdAt: Date;
}
