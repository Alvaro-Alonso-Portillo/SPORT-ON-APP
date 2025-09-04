
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Sport ON | Calendario de Clases',
  description: 'Gestiona tus reservas de clases con facilidad.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased bg-background text-foreground")}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col md:flex-row overflow-x-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
