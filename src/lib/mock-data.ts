import type { ClassInfo, Booking } from "@/types";

export const MOCK_CLASSES: ClassInfo[] = [
  { id: 'yoga-mon-9', name: 'Sunrise Yoga', instructor: 'Anna K.', description: 'A gentle yoga class to start your day.', time: '09:00', day: 'Monday', duration: 60, capacity: 15, attendees: ['user-1', 'user-2'] },
  { id: 'spin-mon-17', name: 'Power Spin', instructor: 'Mike P.', description: 'High-intensity interval training on a bike.', time: '17:00', day: 'Monday', duration: 45, capacity: 20, attendees: [] },
  { id: 'pilates-tue-10', name: 'Core Pilates', instructor: 'Sara L.', description: 'Strengthen your core and improve flexibility.', time: '10:00', day: 'Tuesday', duration: 60, capacity: 12, attendees: ['user-123'] },
  { id: 'hiit-tue-18', name: 'Total Body HIIT', instructor: 'Chris J.', description: 'A full-body workout with high-intensity intervals.', time: '18:00', day: 'Tuesday', duration: 50, capacity: 18, attendees: [] },
  { id: 'zumba-wed-12', name: 'Zumba Dance', instructor: 'Maria G.', description: 'A fun and energetic dance fitness class.', time: '12:00', day: 'Wednesday', duration: 60, capacity: 25, attendees: [] },
  { id: 'strength-wed-19', name: 'Strength Training', instructor: 'David H.', description: 'Build muscle and strength with free weights.', time: '19:00', day: 'Wednesday', duration: 60, capacity: 15, attendees: [] },
  { id: 'yoga-thu-9', name: 'Vinyasa Flow', instructor: 'Anna K.', description: 'A dynamic yoga class linking breath to movement.', time: '09:00', day: 'Thursday', duration: 75, capacity: 15, attendees: [] },
  { id: 'boxing-thu-18', name: 'Cardio Boxing', instructor: 'Mike P.', description: 'A high-energy workout combining boxing and cardio.', time: '18:00', day: 'Thursday', duration: 60, capacity: 20, attendees: [] },
  { id: 'pilates-fri-10', name: 'Reformer Pilates', instructor: 'Sara L.', description: 'Pilates using the reformer machine.', time: '10:00', day: 'Friday', duration: 60, capacity: 8, attendees: Array.from({length: 8}, (_,i)=>`user-${i}`) },
  { id: 'spin-fri-17', name: 'Endurance Spin', instructor: 'Chris J.', description: 'A longer spin class focused on endurance.', time: '17:00', day: 'Friday', duration: 90, capacity: 20, attendees: ['user-123'] },
  { id: 'yoga-sat-11', name: 'Weekend Warrior Yoga', instructor: 'Anna K.', description: 'An invigorating yoga class to kickstart your weekend.', time: '11:00', day: 'Saturday', duration: 90, capacity: 15, attendees: [] },
  { id: 'strength-sun-10', name: 'Full Body Strength', instructor: 'David H.', description: 'A comprehensive strength workout for all major muscle groups.', time: '10:00', day: 'Sunday', duration: 60, capacity: 15, attendees: [] },
];

export const MOCK_USER_BOOKINGS: Booking[] = [
  { id: 'booking-1', userId: 'user-123', classId: 'pilates-tue-10' },
  { id: 'booking-2', userId: 'user-123', classId: 'spin-fri-17' },
];
