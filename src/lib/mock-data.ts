import type { ClassInfo, Booking } from "@/types";

export const MOCK_CLASSES: ClassInfo[] = [
  { id: 'yoga-mon-9', name: 'Entrenamiento', instructor: 'Anna K.', description: 'Una clase de entrenamiento para empezar el día.', time: '09:00', day: 'Lunes', duration: 60, capacity: 15, attendees: ['user-1', 'user-2'] },
  { id: 'spin-mon-17', name: 'Entrenamiento', instructor: 'Mike P.', description: 'Entrenamiento de alta intensidad.', time: '17:00', day: 'Lunes', duration: 45, capacity: 20, attendees: [] },
  { id: 'pilates-tue-10', name: 'Entrenamiento', instructor: 'Sara L.', description: 'Fortalece tu núcleo y mejora la flexibilidad.', time: '10:00', day: 'Martes', duration: 60, capacity: 12, attendees: ['user-123'] },
  { id: 'hiit-tue-18', name: 'Entrenamiento', instructor: 'Chris J.', description: 'Un entrenamiento de cuerpo completo con intervalos de alta intensidad.', time: '18:00', day: 'Martes', duration: 50, capacity: 18, attendees: [] },
  { id: 'zumba-wed-12', name: 'Entrenamiento', instructor: 'Maria G.', description: 'Una clase de fitness divertida y energética.', time: '12:00', day: 'Miércoles', duration: 60, capacity: 25, attendees: [] },
  { id: 'strength-wed-19', name: 'Entrenamiento', instructor: 'David H.', description: 'Construye músculo y fuerza.', time: '19:00', day: 'Miércoles', duration: 60, capacity: 15, attendees: [] },
  { id: 'yoga-thu-9', name: 'Entrenamiento', instructor: 'Anna K.', description: 'Una clase de entrenamiento dinámico.', time: '09:00', day: 'Jueves', duration: 75, capacity: 15, attendees: [] },
  { id: 'boxing-thu-18', name: 'Entrenamiento', instructor: 'Mike P.', description: 'Un entrenamiento de alta energía.', time: '18:00', day: 'Jueves', duration: 60, capacity: 20, attendees: [] },
  { id: 'pilates-fri-10', name: 'Entrenamiento', instructor: 'Sara L.', description: 'Entrenamiento de pilates.', time: '10:00', day: 'Viernes', duration: 60, capacity: 8, attendees: Array.from({length: 8}, (_,i)=>`user-${i}`) },
  { id: 'spin-fri-17', name: 'Entrenamiento', instructor: 'Chris J.', description: 'Una clase de entrenamiento más larga centrada en la resistencia.', time: '17:00', day: 'Viernes', duration: 90, capacity: 20, attendees: ['user-123'] },
  { id: 'yoga-sat-11', name: 'Entrenamiento', instructor: 'Anna K.', description: 'Una clase de entrenamiento vigorizante para empezar el fin de semana.', time: '11:00', day: 'Sábado', duration: 90, capacity: 15, attendees: [] },
  { id: 'strength-sun-10', name: 'Entrenamiento', instructor: 'David H.', description: 'Un entrenamiento de fuerza completo para todos los grupos musculares principales.', time: '10:00', day: 'Domingo', duration: 60, capacity: 15, attendees: [] },
];

export const MOCK_USER_BOOKINGS: Booking[] = [
  { id: 'booking-1', userId: 'user-123', classId: 'pilates-tue-10' },
  { id: 'booking-2', userId: 'user-123', classId: 'spin-fri-17' },
];
