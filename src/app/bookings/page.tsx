import BookingsList from "@/components/bookings/bookings-list";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">Mis Reservas</h1>
            <p className="text-muted-foreground">Ver y gestionar tus próximas clases.</p>
        </div>
        <BookingsList />
    </div>
  );
}
