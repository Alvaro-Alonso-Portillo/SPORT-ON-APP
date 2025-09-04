import LoginForm from "@/components/auth/login-form";
import PhoneAuthForm from "@/components/auth/phone-auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center p-4 h-full">
       <Tabs defaultValue="email" className="w-full max-w-sm mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Correo Electrónico</TabsTrigger>
            <TabsTrigger value="phone">Teléfono</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
                <CardDescription>
                  Introduce tus credenciales para acceder a tu cuenta.
                </CardDescription>
              </CardHeader>
              <LoginForm />
            </Card>
          </TabsContent>
          <TabsContent value="phone">
             <Card className="bg-card text-card-foreground">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Continuar con Teléfono</CardTitle>
                    <CardDescription>
                    Recibirás un código de un solo uso por SMS.
                    </CardDescription>
                </CardHeader>
                <PhoneAuthForm />
             </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
