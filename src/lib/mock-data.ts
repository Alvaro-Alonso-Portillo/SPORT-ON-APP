import type { ClassInfo, Booking } from "@/types";

// This file can be used for initial data, but the calendar now generates classes dynamically.
// You can keep this for other mock data or remove if not needed.

export const MOCK_CLASSES: ClassInfo[] = [
  // Example data, no longer directly driving the full calendar view
  { id: 'pilates-tue-10', name: 'Entrenamiento', description: 'Clase de Entrenamiento.', time: '10:30', day: 'Martes', duration: 75, capacity: 24, attendees: ['user-123'] },
  { id: 'spin-fri-17', name: 'Entrenamiento', description: 'Clase de Entrenamiento.', time: '17:00', day: 'Viernes', duration: 75, capacity: 24, attendees: ['user-123'] },
];

export const MOCK_USER_BOOKINGS: Booking[] = [
  { id: 'booking-1', userId: 'user-123', classId: 'pilates-tue-10' },
  { id: 'booking-2', userId: 'user-123', classId: 'spin-fri-17' },
];
