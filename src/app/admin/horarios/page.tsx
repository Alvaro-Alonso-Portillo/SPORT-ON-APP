"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  CalendarClock,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Clock,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { CalendarOverride, ClassInfo } from "@/types";
import {
  ALL_TIME_SLOTS,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  getDefaultSlotsForDate,
  isDefaultDateDisabled,
  getCalendarOverride,
  saveCalendarOverride,
  deleteCalendarOverride,
  getUpcomingCalendarOverrides,
} from "@/lib/calendar-config";

export default function AdminHorariosPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Fecha seleccionada (por defecto hoy)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // Estado del día editado
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeSlots, setActiveSlots] = useState<string[]>([]);
  const [reason, setReason] = useState<string>("");
  const [customNewSlot, setCustomNewSlot] = useState<string>("");

  // Metadatos
  const [hasOverride, setHasOverride] = useState<boolean>(false);
  const [isLoadingDate, setIsLoadingDate] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Clases y reservas existentes en la fecha seleccionada
  const [existingClasses, setExistingClasses] = useState<ClassInfo[]>([]);

  // Lista de excepciones futuras registradas
  const [upcomingOverrides, setUpcomingOverrides] = useState<CalendarOverride[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState<boolean>(true);

  // Redirección si no es superadmin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace("/login");
    }
  }, [authLoading, isSuperAdmin, router]);

  // Cargar lista de excepciones futuras
  const loadUpcomingOverrides = useCallback(async () => {
    setIsLoadingUpcoming(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const list = await getUpcomingCalendarOverrides(todayStr);
      setUpcomingOverrides(list);
    } catch (err) {
      console.error("Error loading upcoming overrides:", err);
    } finally {
      setIsLoadingUpcoming(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUpcomingOverrides();
    }
  }, [isSuperAdmin, loadUpcomingOverrides]);

  // Cargar datos de la fecha seleccionada
  const loadDateDetails = useCallback(async (date: Date) => {
    setIsLoadingDate(true);
    const dateStr = format(date, "yyyy-MM-dd");

    try {
      // 1. Cargar excepción si existe
      const override = await getCalendarOverride(dateStr);
      const defaultStatus = isDefaultDateDisabled(date);
      const defaultSlots = getDefaultSlotsForDate(date);

      if (override) {
        setHasOverride(true);
        setIsOpen(override.isOpen);
        setActiveSlots(override.slots ? [...override.slots] : [...defaultSlots]);
        setReason(override.reason || "");
      } else {
        setHasOverride(false);
        setIsOpen(!defaultStatus.disabled);
        setActiveSlots(defaultSlots);
        setReason(defaultStatus.reason || "");
      }

      // 2. Cargar clases existentes en Firestore para verificar reservas
      const classesQuery = query(collection(db, "classes"), where("date", "==", dateStr));
      const snapshot = await getDocs(classesQuery);
      const fetchedClasses = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as ClassInfo)
      );
      setExistingClasses(fetchedClasses);
    } catch (err) {
      console.error("Error fetching date details:", err);
      toast({
        variant: "destructive",
        title: "Error al cargar la fecha",
        description: "No se pudieron obtener los datos de la fecha seleccionada.",
      });
    } finally {
      setIsLoadingDate(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuperAdmin && selectedDate) {
      loadDateDetails(selectedDate);
    }
  }, [isSuperAdmin, selectedDate, loadDateDetails]);

  // Manejo de cambio de fecha desde el calendario
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Alternar una franja horaria individual
  const toggleSlot = (slot: string) => {
    setActiveSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      } else {
        const updated = [...prev, slot];
        return updated.sort();
      }
    });
  };

  // Acciones rápidas de horario
  const handleSelectAllSlots = () => {
    setActiveSlots([...ALL_TIME_SLOTS]);
  };

  const handleSelectMorningOnly = () => {
    setActiveSlots([...MORNING_SLOTS]);
  };

  const handleSelectAfternoonOnly = () => {
    setActiveSlots([...AFTERNOON_SLOTS]);
  };

  // Añadir hora personalizada
  const handleAddCustomSlot = () => {
    const trimmed = customNewSlot.trim();
    if (!trimmed) return;

    // Validación formato HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(trimmed)) {
      toast({
        variant: "destructive",
        title: "Formato no válido",
        description: "Usa el formato de hora HH:mm (ejemplo: 07:00, 16:00).",
      });
      return;
    }

    // Normalizar a 2 dígitos en hora (ej. 7:00 -> 07:00)
    const [h, m] = trimmed.split(":");
    const normalized = `${h.padStart(2, "0")}:${m}`;

    if (activeSlots.includes(normalized)) {
      toast({
        title: "Hora ya añadida",
        description: `La hora ${normalized} ya está en la lista.`,
      });
      setCustomNewSlot("");
      return;
    }

    setActiveSlots((prev) => [...prev, normalized].sort());
    setCustomNewSlot("");
    toast({
      title: "Hora añadida",
      description: `Se ha agregado ${normalized} a la lista de horarios.`,
    });
  };

  // Comprobar reservas en conflicto (clases que tienen alumnos pero cuya hora se ha quitado o el día está cerrado)
  const conflictBookings = useMemo(() => {
    if (!existingClasses.length) return [];

    const conflicts: { time: string; attendees: ClassInfo["attendees"] }[] = [];

    existingClasses.forEach((c) => {
      const isSlotRemoved = !isOpen || !activeSlots.includes(c.time);
      if (isSlotRemoved && c.attendees && c.attendees.length > 0) {
        conflicts.push({
          time: c.time,
          attendees: c.attendees,
        });
      }
    });

    return conflicts;
  }, [existingClasses, isOpen, activeSlots]);

  // Guardar configuración en Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const override: CalendarOverride = {
        date: selectedDateStr,
        isOpen: isOpen,
        slots: isOpen ? activeSlots.sort() : [],
        reason: reason.trim(),
        updatedBy: user?.uid || "admin",
      };

      await saveCalendarOverride(override);
      setHasOverride(true);
      await loadUpcomingOverrides();

      toast({
        title: "Horario actualizado con éxito",
        description: `Se han guardado los cambios para el ${format(selectedDate, "d 'de' MMMM", {
          locale: es,
        })}.`,
      });
    } catch (err: any) {
      console.error("Error saving override:", err);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: err?.message || "No se pudieron guardar los cambios en el calendario.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Restablecer a horario por defecto
  const handleResetToDefault = async () => {
    setIsDeleting(true);
    try {
      await deleteCalendarOverride(selectedDateStr);
      setHasOverride(false);
      await loadDateDetails(selectedDate);
      await loadUpcomingOverrides();

      toast({
        title: "Restablecido a horario habitual",
        description: `Se ha eliminado la regla personalizada del ${format(
          selectedDate,
          "d 'de' MMMM",
          { locale: es }
        )}.`,
      });
    } catch (err) {
      console.error("Error resetting override:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo restablecer el horario por defecto.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Formato amigable de la fecha seleccionada
  const formattedHeaderDate = useMemo(() => {
    if (isToday(selectedDate)) {
      return `Hoy, ${format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}`;
    }
    if (isTomorrow(selectedDate)) {
      return `Mañana, ${format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}`;
    }
    return format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
  }, [selectedDate]);

  if (authLoading || (!isSuperAdmin && authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Horarios</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Control de aperturas extraordinarias, cierres y franjas horarias por día.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA: Selector de Fecha + Configuración del Día (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tarjeta de Selección de Fecha */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Seleccionar Fecha a Modificar
                  </CardTitle>
                  <CardDescription>
                    Elige el día que deseas abrir, cerrar o cambiar de horario.
                  </CardDescription>
                </div>
                {/* Accesos rápidos de fecha */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={isToday(selectedDate) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant={isTomorrow(selectedDate) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(addDays(new Date(), 1))}
                  >
                    Mañana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Próximo domingo
                      const d = new Date();
                      const dayOfWeek = d.getDay();
                      const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
                      setSelectedDate(addDays(d, daysUntilSunday));
                    }}
                  >
                    Próx. Domingo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-2 bg-muted/20 rounded-lg border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={es}
                  className="rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Configuración del Día Seleccionado */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl font-bold capitalize">
                      {formattedHeaderDate}
                    </CardTitle>
                    {hasOverride ? (
                      <Badge variant="secondary" className="bg-primary/15 text-primary font-medium">
                        Personalizado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-normal">
                        Horario Habitual
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {isOpen ? "El día estará habilitado para reservas." : "El día estará bloqueado/cerrado."}
                  </CardDescription>
                </div>

                {/* Switch Estado del Día */}
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border">
                  <Switch
                    id="day-status"
                    checked={isOpen}
                    onCheckedChange={(checked) => setIsOpen(checked)}
                    disabled={isLoadingDate}
                  />
                  <Label htmlFor="day-status" className="font-semibold cursor-pointer text-sm">
                    {isOpen ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Día Abierto
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <X className="h-4 w-4" /> Día Cerrado
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {isLoadingDate ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Motivo o Nota */}
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Motivo o Nota del Horario (opcional)
                    </Label>
                    <Input
                      id="reason"
                      placeholder="Ej: Salida anticipada del entrenador, Apertura especial domingo, Festivo local..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {/* Sección de Horarios y Franjas (Solo si el día está abierto) */}
                  {isOpen ? (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Franjas Horarias Activas ({activeSlots.length})
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Haz clic en cada hora para activarla o desactivarla individualmente.
                          </p>
                        </div>

                        {/* Botones de acción rápida */}
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={handleSelectAllSlots}
                          >
                            Abrir Todas
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-7 px-2.5 flex items-center gap-1"
                            onClick={handleSelectMorningOnly}
                          >
                            <Sun className="h-3 w-3" /> Solo Mañana
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-7 px-2.5 flex items-center gap-1"
                            onClick={handleSelectAfternoonOnly}
                          >
                            <Moon className="h-3 w-3" /> Solo Tarde
                          </Button>
                        </div>
                      </div>

                      {/* Cuadrícula de Franjas Horarias con Toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                        {ALL_TIME_SLOTS.map((slot) => {
                          const isSlotActive = activeSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => toggleSlot(slot)}
                              className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                                isSlotActive
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm hover:opacity-90"
                                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted opacity-60 line-through"
                              }`}
                            >
                              <span>{slot}</span>
                              {isSlotActive ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Franjas extraordinarias que no están en la lista estándar */}
                      {activeSlots.filter((s) => !ALL_TIME_SLOTS.includes(s)).length > 0 && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Horas Extraordinarias Adicionales:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {activeSlots
                              .filter((s) => !ALL_TIME_SLOTS.includes(s))
                              .map((slot) => (
                                <Badge
                                  key={slot}
                                  variant="default"
                                  className="flex items-center gap-1 py-1.5 px-3"
                                >
                                  <span>{slot}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSlot(slot)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Añadir hora extraordinaria puntual */}
                      <div className="flex items-center gap-2 pt-2">
                        <Input
                          placeholder="Otra hora (ej: 07:00, 16:00)"
                          value={customNewSlot}
                          onChange={(e) => setCustomNewSlot(e.target.value)}
                          className="max-w-[220px] text-sm h-9"
                          maxLength={5}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomSlot}
                          className="h-9 gap-1"
                        >
                          <Plus className="h-4 w-4" /> Añadir hora
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Este día aparecerá completamente deshabilitado en el calendario
                      </p>
                      <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                        Los alumnos no podrán reservar ninguna clase durante esta fecha. Si hay reservas
                        previas, revisa el aviso a continuación.
                      </p>
                    </div>
                  )}

                  {/* Alerta de Conflicto si hay alumnos reservados en horas que se cierran */}
                  {conflictBookings.length > 0 && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm space-y-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span>¡Atención! Hay alumnos con reserva en horarios que estás cerrando:</span>
                      </div>
                      <div className="pl-7 space-y-1.5 text-xs">
                        {conflictBookings.map((conflict, idx) => (
                          <div key={idx} className="bg-amber-100/60 dark:bg-amber-900/40 p-2 rounded">
                            <span className="font-bold text-amber-950 dark:text-amber-100">
                              Clase de las {conflict.time}:
                            </span>{" "}
                            {conflict.attendees.map((a) => a.name).join(", ")} ({conflict.attendees.length}{" "}
                            {conflict.attendees.length === 1 ? "alumno" : "alumnos"})
                          </div>
                        ))}
                        <p className="italic text-muted-foreground pt-1">
                          Nota: Recuerda avisar a los alumnos o cancelar sus reservas desde "Gestión de
                          Asistencia".
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Botones de Guardar y Restablecer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {hasOverride ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive w-full sm:w-auto"
                            disabled={isDeleting || isSaving}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restablecer a horario habitual
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Restablecer fecha a horario por defecto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminarán todas las personalizaciones y excepciones del día{" "}
                              {formattedHeaderDate}. Volverá a aplicarse el calendario estándar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleResetToDefault}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Restablecer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <div />
                    )}

                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || isDeleting}
                      className="w-full sm:w-auto gap-2 px-6"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Guardar Cambios para este Día
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Lista de Excepciones y Horarios Especiales Programados (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Excepciones Programadas
              </CardTitle>
              <CardDescription>
                Días modificados a futuro respecto al calendario habitual.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {isLoadingUpcoming ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingOverrides.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 text-center text-muted-foreground text-sm space-y-1">
                  <p className="font-medium">No hay excepciones activas</p>
                  <p className="text-xs">
                    Todos los días futuros siguen el calendario estándar del centro.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {upcomingOverrides.map((item) => {
                    const parsed = parseISO(item.date);
                    const isSelected = item.date === selectedDateStr;

                    return (
                      <div
                        key={item.date}
                        className={`p-3 rounded-lg border text-sm transition-all flex flex-col gap-2 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold capitalize">
                            {format(parsed, "EEE d MMM yyyy", { locale: es })}
                          </div>
                          {item.isOpen ? (
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs">
                              Abierto ({item.slots ? item.slots.length : "habitual"}h)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs">
                              Cerrado
                            </Badge>
                          )}
                        </div>

                        {item.reason && (
                          <p className="text-xs text-muted-foreground italic">"{item.reason}"</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary"
                            onClick={() => setSelectedDate(parsed)}
                          >
                            Editar <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              await deleteCalendarOverride(item.date);
                              await loadUpcomingOverrides();
                              if (item.date === selectedDateStr) {
                                await loadDateDetails(selectedDate);
                              }
                              toast({
                                title: "Excepción eliminada",
                                description: `El día ${item.date} ha vuelto al horario habitual.`,
                              });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
