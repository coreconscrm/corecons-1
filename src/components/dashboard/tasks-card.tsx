import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

const tasks = [
  { id: "task1", label: "Resolver Ecuaciones Diferenciales", due: "Hoy" },
  { id: "task2", label: "Proyecto final de IA", due: "Mañana" },
  { id: "task3", label: "Leer 'Cien años de soledad'", due: "Viernes" },
  { id: "task4", label: "Entregar ensayo de historia", due: "2 Días" },
  { id: "task5", label: "Práctica de programación", due: "3 Días" },
  { id: "task6", label: "Estudiar para examen", due: "4 Días" },
];

export function TasksCard() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Tareas Pendientes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 -mt-2">
        <ScrollArea className="h-[320px]">
          <div className="space-y-4 pr-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary"
              >
                <div className="flex items-center gap-4">
                  <Checkbox id={task.id} />
                  <label
                    htmlFor={task.id}
                    className="font-medium text-foreground cursor-pointer"
                  >
                    {task.label}
                  </label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {task.due}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir tarea
        </Button>
      </CardFooter>
    </Card>
  );
}
