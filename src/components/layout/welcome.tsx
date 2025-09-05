"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Motivational quotes for the welcome screen
const motivationalQuotes = [
  "La disciplina es el puente entre las metas y los logros.",
  "Tu único límite es tu mente.",
  "No te detengas hasta que te sientas orgulloso.",
  "El dolor que sientes hoy será la fuerza que sentirás mañana.",
  "Cada entrenamiento cuenta.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Entrena fuerte o permanece igual.",
  "Tu cuerpo logra lo que tu mente cree.",
  "Nunca te rindas, cada repetición te acerca más a tu meta.",
  "Si no te reta, no te cambia.",
  "Enciende tu mejor versión con SportON.",
  "Con SportON no hay excusas, solo resultados.",
  "SportON: donde tu límite se convierte en tu punto de partida.",
  "Cada día en SportON es una oportunidad para superarte.",
  "SportON: activa tu disciplina, activa tu vida.",
  "El cambio empieza aquí, en SportON.",
  "En SportON transformas esfuerzo en orgullo.",
  "SportON: energía que no se apaga."
];

export default function Welcome() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Generate random quote only on the client-side after mount
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background text-foreground">
      <div className="text-center p-4">
        <img
          src="/logo.png"
          alt="Sport ON Logo"
          width="320"
          height="85"
          loading="eager"
          style={{ height: 'auto', width: '320px' }}
          className="mx-auto"
        />
        <p className="mt-4 text-lg md:text-xl text-muted-foreground italic h-7">
          {quote}
        </p>
        <Loader2 className="mt-8 h-12 w-12 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}