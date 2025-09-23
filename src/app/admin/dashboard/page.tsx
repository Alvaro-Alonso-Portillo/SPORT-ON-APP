
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, CalendarCheck } from 'lucide-react';
import type { ClassInfo, UserProfile } from '@/types';
import UserGrowthChart from '@/components/admin/user-growth-chart';
import PopularHoursChart from '@/components/admin/popular-hours-chart';

export type UserGrowthData = {
  date: string;
  Nuevos: number;
}[];

export type PopularHoursData = {
  time: string;
  Reservas: number;
}[];

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState(0);
  const [todaysBookings, setTodaysBookings] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData>([]);
  const [popularHoursData, setPopularHoursData] = useState<PopularHoursData>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

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
          setTotalUsers(usersSnapshot.size);

          const todayString = format(new Date(), 'yyyy-MM-dd');
          const todayClassesQuery = query(collection(db, 'classes'), where('date', '==', todayString));
          const todayClassesSnapshot = await getDocs(todayClassesQuery);
          let bookingsCount = 0;
          todayClassesSnapshot.forEach(doc => {
            bookingsCount += (doc.data() as ClassInfo).attendees.length;
          });
          setTodaysBookings(bookingsCount);
          setMetricsLoading(false);

          // --- Fetch data for charts ---
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

          // Popular Hours Data
          const classesQuery = query(collection(db, 'classes'), where('date', '>=', format(sevenDaysAgo, 'yyyy-MM-dd')));
          const recentClassesSnapshot = await getDocs(classesQuery);
          const bookingsByHour: Record<string, number> = {};
          
          recentClassesSnapshot.forEach(doc => {
            const classData = doc.data() as ClassInfo;
            const timeSlot = classData.time;
            bookingsByHour[timeSlot] = (bookingsByHour[timeSlot] || 0) + classData.attendees.length;
          });

          const formattedPopularHoursData = Object.entries(bookingsByHour)
            .map(([time, count]) => ({ time, Reservas: count }))
            .sort((a, b) => a.time.localeCompare(b.time));
          setPopularHoursData(formattedPopularHoursData);


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

  if (authLoading || !isSuperAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="h-full w-full p-4 md:p-8 space-y-6">
      <h1 className="font-headline text-2xl md:text-4xl font-bold">Dashboard de Administración</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas para Hoy
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
               <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{todaysBookings}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
      </div>

    </div>
  );
}
