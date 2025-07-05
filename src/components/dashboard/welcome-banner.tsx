import { Button } from "@/components/ui/button";
import { Book, CheckSquare } from "lucide-react";

export function WelcomeBanner() {
  return (
    <div className="bg-card p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">¡Hola de nuevo, Alex!</h1>
        <p className="text-muted-foreground">
          Es un buen día para aprender algo nuevo. ¡Vamos a ello!
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <Button>
          <Book className="mr-2 h-4 w-4" />
          Ir a clases
        </Button>
        <Button variant="secondary">
          <CheckSquare className="mr-2 h-4 w-4" />
          Ver Tareas
        </Button>
      </div>
    </div>
  );
}
