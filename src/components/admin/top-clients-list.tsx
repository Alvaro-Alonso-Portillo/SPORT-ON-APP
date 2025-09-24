
"use client";

import type { TopClientData } from "@/app/admin/dashboard/page";
import UserAvatar from "@/components/ui/user-avatar";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopClientsListProps {
  data: TopClientData[];
}

const medalColors = [
    "text-yellow-400", // Gold
    "text-gray-400",   // Silver
    "text-yellow-600"  // Bronze
]

export default function TopClientsList({ data }: TopClientsListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground">
        <p className="font-semibold">No hay datos de asistencia</p>
        <p className="text-sm">Aún no se han registrado asistencias a clases pasadas.</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] space-y-2 overflow-y-auto pr-2">
      {data.map((client, index) => (
        <div 
            key={client.uid} 
            className={cn(
                "flex items-center gap-4 p-2 rounded-lg",
                index < 3 ? "bg-secondary" : "bg-transparent"
            )}
        >
          <span className="font-bold text-lg w-6 text-center text-muted-foreground">{index + 1}</span>
          <UserAvatar user={client} className="h-10 w-10" />
          <div className="flex-1">
            <p className="font-semibold truncate">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.count} asistencias</p>
          </div>
          {index < 3 && <Trophy className={cn("h-6 w-6", medalColors[index])} />}
        </div>
      ))}
    </div>
  );
}

  