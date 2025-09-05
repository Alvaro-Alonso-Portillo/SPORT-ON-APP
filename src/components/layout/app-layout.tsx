
"use client";

import { useAuth } from "@/hooks/use-auth";
import Header from "./header";
import Sidebar from "./sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row overflow-x-hidden">
      {user && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
