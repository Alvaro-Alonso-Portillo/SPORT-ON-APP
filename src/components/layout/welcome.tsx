
import { Loader2 } from "lucide-react";

export default function Welcome() {
  const motivationalQuotes = [
    "La disciplina es el puente entre las metas y los logros.",
    "Tu único límite es tu mente.",
    "No te detengas hasta que te sientas orgulloso.",
    "El dolor que sientes hoy será la fuerza que sentirás mañana.",
    "Cada entrenamiento cuenta."
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-headline font-bold">
          Sport <span className="text-primary">ON</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground italic">
          {randomQuote}
        </p>
        <Loader2 className="mt-8 h-12 w-12 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}
