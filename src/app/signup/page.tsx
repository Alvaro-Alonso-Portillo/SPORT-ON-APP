import SignupForm from "@/components/auth/signup-form";
import PhoneAuthForm from "@/components/auth/phone-auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center p-4 h-full">
       <Tabs defaultValue="email" className="w-full max-w-sm mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Correo Electrónico</TabsTrigger>
          <TabsTrigger value="phone">Teléfono</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
            <SignupForm />
        </TabsContent>
        <TabsContent value="phone">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Registrarse con Teléfono</CardTitle>
              <CardDescription>
                Recibirás un SMS con un código de verificación para crear tu cuenta.
              </CardDescription>
            </CardHeader>
            <PhoneAuthForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
