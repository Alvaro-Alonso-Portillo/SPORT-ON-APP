import BookingsList from "@/components/bookings/bookings-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl md:text-4xl">My Bookings</CardTitle>
                <CardDescription>View and manage your upcoming classes.</CardDescription>
            </CardHeader>
            <CardContent>
                <BookingsList />
            </CardContent>
        </Card>
    </div>
  );
}
