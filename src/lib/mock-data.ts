import type { ClassInfo, Booking } from "@/types";

export const MOCK_CLASSES: ClassInfo[] = [
  { id: 'yoga-mon-9', name: 'Entrenamiento', instructor: 'Anna K.', description: 'Una clase de entrenamiento para empezar el día.', time: '09:15', day: 'Lunes', duration: 75, capacity: 24, attendees: ['user-1', 'user-2'] },
  { id: 'spin-mon-17', name: 'Entrenamiento', instructor: 'Mike P.', description: 'Entrenamiento de alta intensidad.', time: '17:00', day: 'Lunes', duration: 75, capacity: 24, attendees: [] },
  { id: 'pilates-tue-10', name: 'Entrenamiento', instructor: 'Sara L.', description: 'Fortalece tu núcleo y mejora la flexibilidad.', time: '10:30', day: 'Martes', duration: 75, capacity: 24, attendees: ['user-123'] },
  { id: 'hiit-tue-18', name: 'Entrenamiento', instructor: 'Chris J.', description: 'Un entrenamiento de cuerpo completo con intervalos de alta intensidad.', time: '18:15', day: 'Martes', duration: 75, capacity: 24, attendees: [] },
  { id: 'zumba-wed-12', name: 'Entrenamiento', instructor: 'Maria G.', description: 'Una clase de fitness divertida y energética.', time: '11:45', day: 'Miércoles', duration: 75, capacity: 24, attendees: [] },
  { id: 'strength-wed-19', name: 'Entrenamiento', instructor: 'David H.', description: 'Construye músculo y fuerza.', time: '19:30', day: 'Miércoles', duration: 75, capacity: 24, attendees: [] },
  { id: 'yoga-thu-9', name: 'Entrenamiento', instructor: 'Anna K.', description: 'Una clase de entrenamiento dinámico.', time: '08:00', day: 'Jueves', duration: 75, capacity: 24, attendees: [] },
  { id: 'boxing-thu-18', name: 'Entrenamiento', instructor: 'Mike P.', description: 'Un entrenamiento de alta energía.', time: '18:15', day: 'Jueves', duration: 75, capacity: 24, attendees: [] },
  { id: 'pilates-fri-10', name: 'Entrenamiento', instructor: 'Sara L.', description: 'Entrenamiento de pilates.', time: '10:30', day: 'Viernes', duration: 75, capacity: 24, attendees: Array.from({length: 24}, (_,i)=>`user-${i}`) },
  { id: 'spin-fri-17', name: 'Entrenamiento', instructor: 'Chris J.', description: 'Una clase de entrenamiento más larga centrada en la resistencia.', time: '17:00', day: 'Viernes', duration: 75, capacity: 24, attendees: ['user-123'] },
  { id: 'last-class-fri', name: 'Entrenamiento', instructor: 'John D.', description: 'Última clase del día.', time: '20:45', day: 'Viernes', duration: 75, capacity: 24, attendees: [] },

];

export const MOCK_USER_BOOKINGS: Booking[] = [
  { id: 'booking-1', userId: 'user-123', classId: 'pilates-tue-10' },
  { id: 'booking-2', userId: 'user-123', classId: 'spin-fri-17' },
];

    