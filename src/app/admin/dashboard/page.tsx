
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, CalendarCheck } from 'lucide-react';
import type { ClassInfo } from '@/types';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState(0);
  const [todaysBookings, setTodaysBookings] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/login');
    }

    if (isSuperAdmin) {
      const fetchMetrics = async () => {
        setMetricsLoading(true);
        try {
          // Fetch total users
          const usersSnapshot = await getDocs(collection(db, 'users'));
          setTotalUsers(usersSnapshot.size);

          // Fetch today's bookings
          const todayString = format(new Date(), 'yyyy-MM-dd');
          const classesQuery = query(collection(db, 'classes'), where('date', '==', todayString));
          const classesSnapshot = await getDocs(classesQuery);
          
          let bookingsCount = 0;
          classesSnapshot.forEach(doc => {
            const classData = doc.data() as ClassInfo;
            bookingsCount += classData.attendees.length;
          });
          setTodaysBookings(bookingsCount);

        } catch (error) {
          console.error("Error fetching admin metrics:", error);
        } finally {
          setMetricsLoading(false);
        }
      };
      
      fetchMetrics();
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
    </div>
  );
}
