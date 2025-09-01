import ProfileForm from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-headline text-2xl md:text-4xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gestiona tu información personal. Los cambios se guardarán en tu perfil.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
