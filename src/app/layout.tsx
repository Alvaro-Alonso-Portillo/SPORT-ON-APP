
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/auth-provider';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layout/app-layout';

export const metadata: Metadata = {
  title: 'Sport ON | Calendario de Clases',
  description: 'Gestiona tus reservas de clases con facilidad.',
  manifest: '/manifest.webmanifest',
  icons: {
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head />
      <body className={cn("font-body antialiased bg-background text-foreground")}>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
