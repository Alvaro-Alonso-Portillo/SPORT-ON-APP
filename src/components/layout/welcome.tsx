
"use client";

import { useState, useEffect } from "react";
import { Loader2, Power } from "lucide-react";

const motivationalQuotes = [
  "La disciplina es el puente entre las metas y los logros.",
  "Tu único límite es tu mente.",
  "No te detengas hasta que te sientas orgulloso.",
  "El dolor que sientes hoy será la fuerza que sentirás mañana.",
  "Cada entrenamiento cuenta."
];

export default function Welcome() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Generate random quote only on the client-side after mount
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-headline font-bold flex items-center">
          Sport
          <span className="text-primary flex items-center">
            <Power className="mx-1 h-16 w-16 md:h-20 md:w-20" />N
          </span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground italic h-7">
          {quote}
        </p>
        <Loader2 className="mt-8 h-12 w-12 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}
