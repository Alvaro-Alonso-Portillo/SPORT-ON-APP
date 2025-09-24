
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, startOfDay, endOfDay, parseISO, isPast, startOfMonth, endOfMonth, addMonths, subMonths, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, CalendarCheck, Percent, Clock, ChevronLeft, ChevronRight, Divide, CalendarIcon } from 'lucide-react';
import type { ClassInfo, UserProfile } from '@/types';
import UserGrowthChart from '@/components/admin/user-growth-chart';
import PopularHoursChart from '@/components/admin/popular-hours-chart';
import OccupancyChart from '@/components/admin/occupancy-chart';
import AttendanceByDayChart from '@/components/admin/attendance-by-day-chart';
import TopClientsList from '@/components/admin/top-clients-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type UserGrowthData = {
  date: string;
  Nuevos: number;
}[];

export type PopularHoursData = {
  time: string;
  Reservas: number;
};

export type OccupancyData = {
    name: string;
    value: number;
    fill: string;
}[];

export type AttendanceByDayData = {
    name: string;
    asistentes: number;
    fill: string;
};

export type TopClientData = {
  uid: string;
  name: string;
  count: number;
  photoURL?: string;
};


export default function AdminDashboardPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState(0);
  const [todaysBookings, setTodaysBookings] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData>([]);
  const [popularHoursData, setPopularHoursData] = useState<PopularHoursData[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [attendanceByDayData, setAttendanceByDayData] = useState<AttendanceByDayData[]>([]);
  const [topClientsData, setTopClientsData] = useState<TopClientData[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [topClientsLoading, setTopClientsLoading] = useState(true);

  const fetchTopClients = useCallback(async (month: Date) => {
    setTopClientsLoading(true);
    try {
        const startOfSelectedMonth = startOfMonth(month);
        const endOfSelectedMonth = endOfMonth(month);
        const monthlyClassesQuery = query(collection(db, 'classes'), 
            where('date', '>=', format(startOfSelectedMonth, 'yyyy-MM-dd')),
            where('date', '<=', format(endOfSelectedMonth, 'yyyy-MM-dd'))
        );
        const monthlyClassesSnapshot = await getDocs(monthlyClassesQuery);
        const attendanceCounts: Record<string, { uid: string; name: string; count: number; photoURL?: string }> = {};
        
        monthlyClassesSnapshot.forEach(doc => {
          const classData = doc.data() as ClassInfo;
          const classDateTime = parseISO(`${classData.date}T${classData.time}`);
          if (isPast(classDateTime)) {
              classData.attendees.forEach(attendee => {
                  if (attendee.status === 'asistido') {
                      if (attendanceCounts[attendee.uid]) {
                          attendanceCounts[attendee.uid].count++;
                      } else {
                          attendanceCounts[attendee.uid] = {
                              uid: attendee.uid,
                              name: attendee.name,
                              count: 1,
                              photoURL: attendee.photoURL
                          };
                      }
                  }
              });
          }
        });
        
        const sortedClients = Object.values(attendanceCounts)
          .sort((a, b) => b.count - a.count);
        setTopClientsData(sortedClients);
    } catch (error) {
        console.error("Error fetching top clients:", error);
    } finally {
        setTopClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/login');
    }

    if (isSuperAdmin) {
      const fetchAllData = async () => {
        setMetricsLoading(true);
        setChartsLoading(true);

        try {
          // --- Fetch basic metrics ---
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const totalUserCount = usersSnapshot.size;
          setTotalUsers(totalUserCount);

          const todayString = format(new Date(), 'yyyy-MM-dd');
          const todayClassesQuery = query(collection(db, 'classes'), where('date', '==', todayString));
          const todayClassesSnapshot = await getDocs(todayClassesQuery);
          let bookingsCount = 0;
          let totalCapacity = 0;
          todayClassesSnapshot.forEach(doc => {
            const classData = doc.data() as ClassInfo;
            bookingsCount += classData.attendees.length;
            totalCapacity += classData.capacity;
          });
          
          const currentOccupancyRate = totalCapacity > 0 ? Math.round((bookingsCount / totalCapacity) * 100) : 0;
          setTodaysBookings(bookingsCount);
          setOccupancyRate(currentOccupancyRate);

          setOccupancyData([
            { name: 'Ocupadas', value: currentOccupancyRate, fill: 'hsl(var(--primary))' },
            { name: 'Libres', value: 100 - currentOccupancyRate, fill: 'hsl(var(--muted))' }
          ]);


          // --- Fetch data for charts and advanced metrics ---
          const thirtyDaysAgo = subDays(new Date(), 30);
          const sevenDaysAgo = subDays(new Date(), 7);

          // User Growth Data
          const usersQuery = query(collection(db, 'users'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)));
          const recentUsersSnapshot = await getDocs(usersQuery);
          const usersByDay: Record<string, number> = {};
          
          recentUsersSnapshot.forEach(doc => {
            const userData = doc.data() as UserProfile;
            const createdAtDate = (userData.createdAt as Timestamp).toDate();
            const dateKey = format(createdAtDate, 'MMM d', { locale: es });
            usersByDay[dateKey] = (usersByDay[dateKey] || 0) + 1;
          });
          
          const formattedUserGrowthData = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(new Date(), 29 - i);
            const dateKey = format(date, 'MMM d', { locale: es });
            return { date: dateKey, Nuevos: usersByDay[dateKey] || 0 };
          });
          setUserGrowthData(formattedUserGrowthData);
          
          // Data for charts (Last 7 days)
          const recentClassesQuery = query(collection(db, 'classes'), where('date', '>=', format(sevenDaysAgo, 'yyyy-MM-dd')));
          const recentClassesSnapshot = await getDocs(recentClassesQuery);
          const recentBookingsByHour: Record<string, number> = {};
          const attendanceByDay: Record<string, number> = { 'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0, 'Domingo': 0 };

          recentClassesSnapshot.forEach(doc => {
            const classData = doc.data() as ClassInfo;
            // Popular Hours
            recentBookingsByHour[classData.time] = (recentBookingsByHour[classData.time] || 0) + classData.attendees.length;

            // Attendance by Day
            const classDate = parseISO(classData.date);
            const dayName = format(classDate, 'EEEE', { locale: es });
            const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            if(attendanceByDay.hasOwnProperty(capitalizedDayName)) {
                attendanceByDay[capitalizedDayName] += classData.attendees.length;
            }
          });

          // Format Popular Hours Chart Data
          const formattedPopularHoursData = Object.entries(recentBookingsByHour)
            .map(([time, count]) => ({ time, Reservas: count }))
            .sort((a, b) => a.time.localeCompare(b.time));
          setPopularHoursData(formattedPopularHoursData);

          // Format Attendance by Day Chart Data
          const softColorPalette = [
            '#a1c9f4', // Azul suave
            '#b2e2a4', // Menta
            '#ffb482', // Melocotón
            '#d6bcf0', // Lavanda
            '#f9cb9c', // Naranja suave
            '#f4c7c3', // Rosa suave
            '#fff2a5', // Amarillo suave
          ];
          const weekOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const formattedAttendanceData = weekOrder
            .map((day, index) => ({
                name: day,
                asistentes: attendanceByDay[day],
                fill: softColorPalette[index % softColorPalette.length]
            }))
            .filter(d => d.asistentes > 0);
          setAttendanceByDayData(formattedAttendanceData);


        } catch (error) {
          console.error("Error fetching admin data:", error);
        } finally {
          setMetricsLoading(false);
          setChartsLoading(false);
        }
      };
      
      fetchAllData();
    }
  }, [user, authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
        fetchTopClients(selectedMonth);
    }
  }, [isSuperAdmin, selectedMonth, fetchTopClients]);
  
  const handleMonthChange = (monthValue: string) => {
    const newDate = setMonth(selectedMonth, parseInt(monthValue));
    setSelectedMonth(newDate);
  };

  const handleYearChange = (yearValue: string) => {
    const newDate = setYear(selectedMonth, parseInt(yearValue));
    setSelectedMonth(newDate);
  };
  
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthName = format(new Date(0, i), 'MMMM', { locale: es });
    return {
        value: i.toString(),
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    }
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2023 }, (_, i) => ({
    value: (2024 + i).toString(),
    label: (2024 + i).toString(),
  }));
  
  const formattedMonthTitle = format(selectedMonth, 'MMMM yyyy', { locale: es });
  const capitalizedMonthTitle = formattedMonthTitle.charAt(0).toUpperCase() + formattedMonthTitle.slice(1);

  if (authLoading || !isSuperAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-headline text-2xl md:text-4xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground text-sm md:text-base">Un resumen del rendimiento y crecimiento del negocio.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
              <CardTitle>Ocupación de Clases (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
              {chartsLoading ? (
                  <Skeleton className="h-[180px] w-full" />
              ) : (
                  <OccupancyChart data={occupancyData} occupancyRate={occupancyRate} />
              )}
          </CardContent>
        </Card>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuarios Totales
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reservas (Hoy)
                </CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{todaysBookings}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ocupación (Hoy)
                </CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{occupancyRate}%</div>}
              </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Crecimiento de Usuarios (Últimos 30 días)</CardTitle>
            </CardHeader>
            <CardContent>
                {chartsLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                ) : (
                    <UserGrowthChart data={userGrowthData} />
                )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Afluencia por Día (Últimos 7 días)</CardTitle>
            </CardHeader>
            <CardContent>
                {chartsLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                ) : (
                    <AttendanceByDayChart data={attendanceByDayData} />
                )}
            </CardContent>
        </Card>
       </div>
       <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>Horarios Más Populares (Últimos 7 días)</CardTitle>
            </CardHeader>
            <CardContent>
                {chartsLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                ) : (
                    <PopularHoursChart data={popularHoursData} />
                )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base md:text-lg whitespace-nowrap">
                  Ranking de Clientes 
                  <span className="text-primary font-bold text-lg md:text-xl ml-2">{capitalizedMonthTitle}</span>
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={getMonth(selectedMonth).toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-full sm:w-auto p-2 h-10">
                        <SelectValue asChild>
                           <CalendarIcon className="h-4 w-4" />
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select value={getYear(selectedMonth).toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-full sm:w-[90px]">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
            </CardHeader>
            <CardContent>
                {topClientsLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                ) : (
                    <TopClientsList data={topClientsData} />
                )}
            </CardContent>
        </Card>
       </div>

    </div>
  );
}
