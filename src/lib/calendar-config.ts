import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import type { CalendarOverride } from '@/types';

export const ALL_TIME_SLOTS: string[] = [
  "08:00", "09:15", "10:30", "11:45", "13:00", 
  "14:15", "17:00", "18:15", "19:30", "20:45"
];

export const MORNING_SLOTS: string[] = [
  "08:00", "09:15", "10:30", "11:45", "13:00", "14:15"
];

export const AFTERNOON_SLOTS: string[] = [
  "17:00", "18:15", "19:30", "20:45"
];

export const DEFAULT_HOLIDAYS: string[] = [
  "2025-09-22",
  "2025-10-04",
  "2025-10-13",
  "2025-12-08",
  "2025-12-25",
  "2026-01-01",
  "2026-01-06",
  "2026-04-03",
  "2026-05-01",
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16",
  "2026-10-12",
  "2026-11-02",
  "2026-12-08",
  "2026-12-25",
];

/**
 * Determina si una fecha está deshabilitada por defecto según el calendario base
 */
export const isDefaultDateDisabled = (date: Date): { disabled: boolean; reason?: string } => {
  const dayName = format(date, 'eeee', { locale: es }).toLowerCase();
  const dateString = format(date, 'yyyy-MM-dd');
  const monthDay = format(date, 'MM-dd');

  // Fines de semana
  if (dayName === 'domingo' || dayName === 'sábado') {
    return { disabled: true, reason: 'Fin de semana' };
  }

  // Días festivos
  if (DEFAULT_HOLIDAYS.includes(dateString)) {
    return { disabled: true, reason: 'Festivo' };
  }

  // Vacaciones de agosto
  if (monthDay >= '08-01' && monthDay <= '08-16') {
    return { disabled: true, reason: 'Cierre vacaciones de verano' };
  }

  return { disabled: false };
};

/**
 * Devuelve los horarios predeterminados para una fecha si no hay excepción
 */
export const getDefaultSlotsForDate = (date: Date): string[] => {
  const defaultStatus = isDefaultDateDisabled(date);
  if (defaultStatus.disabled) {
    return [];
  }

  const dateString = format(date, 'yyyy-MM-dd');
  const dayName = format(date, 'eeee', { locale: es });
  const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const monthDay = format(date, 'MM-dd');

  // Casos especiales predeterminados heredados
  if (dateString === '2026-04-02') {
    return ["08:00", "09:15", "10:30", "11:45", "13:00", "14:15"];
  }
  if (dateString === '2026-06-03') {
    return ["08:00", "09:15", "10:30", "11:45", "13:00", "14:15", "17:00", "18:15", "19:30"];
  }
  if (dateString === '2026-06-04') {
    return ["09:15", "10:30", "11:45", "13:00"];
  }
  if (dateString === '2026-06-05') {
    return ["08:00", "09:15", "10:30", "11:45"];
  }

  let timeSlots = [...ALL_TIME_SLOTS];

  // Viernes sin última hora
  if (capitalizedDayName === "Viernes") {
    timeSlots = timeSlots.filter(t => t !== "20:45");
  }

  if (dateString === '2026-08-18' || dateString === '2026-08-20') {
    timeSlots = timeSlots.filter(t => t !== "20:45");
  }

  if (monthDay === '12-24' || monthDay === '12-31') {
    timeSlots = timeSlots.filter(t => !AFTERNOON_SLOTS.includes(t));
  }

  if (monthDay === '01-05') {
    timeSlots = timeSlots.filter(t => !AFTERNOON_SLOTS.includes(t) && t !== "14:15");
  }

  return timeSlots;
};

// ==================== FIRESTORE HELPERS ====================

const OVERRIDES_COLLECTION = 'calendar_overrides';

/**
 * Obtiene todas las excepciones en un rango de fechas (ej. la semana actual)
 */
export const getCalendarOverridesForRange = async (
  startDateStr: string,
  endDateStr: string
): Promise<Record<string, CalendarOverride>> => {
  try {
    const q = query(
      collection(db, OVERRIDES_COLLECTION),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );
    const snapshot = await getDocs(q);
    const overrides: Record<string, CalendarOverride> = {};
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CalendarOverride;
      overrides[data.date] = { ...data, id: docSnap.id };
    });
    return overrides;
  } catch (error) {
    console.error('Error fetching calendar overrides range:', error);
    return {};
  }
};

/**
 * Obtiene la excepción para una fecha concreta si existe
 */
export const getCalendarOverride = async (dateStr: string): Promise<CalendarOverride | null> => {
  try {
    const docRef = doc(db, OVERRIDES_COLLECTION, dateStr);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { ...(snapshot.data() as CalendarOverride), id: snapshot.id };
  } catch (error) {
    console.error(`Error fetching calendar override for ${dateStr}:`, error);
    return null;
  }
};

/**
 * Guarda o actualiza una excepción de fecha y horarios
 */
export const saveCalendarOverride = async (override: CalendarOverride): Promise<void> => {
  const docRef = doc(db, OVERRIDES_COLLECTION, override.date);
  await setDoc(docRef, {
    ...override,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

/**
 * Elimina una excepción de fecha, devolviéndola a su estado por defecto
 */
export const deleteCalendarOverride = async (dateStr: string): Promise<void> => {
  const docRef = doc(db, OVERRIDES_COLLECTION, dateStr);
  await deleteDoc(docRef);
};

/**
 * Obtiene las excepciones futuras o recientes ordenadas por fecha
 */
export const getUpcomingCalendarOverrides = async (fromDateStr: string): Promise<CalendarOverride[]> => {
  try {
    const q = query(
      collection(db, OVERRIDES_COLLECTION),
      where('date', '>=', fromDateStr),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      ...(docSnap.data() as CalendarOverride),
      id: docSnap.id
    }));
  } catch (error) {
    console.error('Error fetching upcoming overrides:', error);
    return [];
  }
};
