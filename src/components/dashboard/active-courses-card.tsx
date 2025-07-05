import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Book, BrainCircuit, Code, Calculator } from "lucide-react";

const courses = [
  { name: "Álgebra Avanzada", progress: 75, icon: Calculator },
  { name: "Introducción a la IA", progress: 45, icon: BrainCircuit },
  { name: "Desarrollo Web Full-Stack", progress: 80, icon: Code },
  { name: "Literatura Universal", progress: 60, icon: Book },
];

export function ActiveCoursesCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cursos Activos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {courses.map((course) => (
          <div key={course.name}>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-secondary p-3 rounded-lg">
                <course.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{course.name}</p>
                <p className="text-sm text-muted-foreground">
                  Progreso del curso
                </p>
              </div>
              <span className="font-semibold text-foreground">
                {course.progress}%
              </span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
