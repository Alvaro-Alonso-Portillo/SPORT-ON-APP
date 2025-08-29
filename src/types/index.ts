export interface ClassInfo {
  id: string;
  name: string;
  description: string;
  time: string;
  day: string;
  duration: number;
  capacity: number;
  attendees: string[]; // Array of user UIDs
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
