import BookingsList from "@/components/bookings/bookings-list";

export default function BookingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
        <div>
            <h1 className="font-headline text-2xl md:text-4xl font-bold">Mis Reservas</h1>
            <p className="text-muted-foreground text-sm md:text-base">Ver y gestionar tus próximas clases.</p>
        </div>
        <BookingsList />
    </div>
  );
}
