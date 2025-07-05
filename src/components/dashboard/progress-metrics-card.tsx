import { Card, CardContent } from "@/components/ui/card";
import { Award, BookOpenCheck, Trophy, Target } from "lucide-react";

const metrics = [
  { icon: BookOpenCheck, label: "Cursos Completados", value: "12" },
  { icon: Target, label: "Promedio General", value: "92.5%" },
  { icon: Trophy, label: "Logros Desbloqueados", value: "25" },
  { icon: Award, label: "Rango Actual", value: "Maestro" },
];

export function ProgressMetricsCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-secondary space-y-2 transition-transform duration-200 hover:scale-105 hover:bg-card/60"
            >
              <metric.icon className="h-8 w-8 text-primary mx-auto" />
              <p className="text-3xl font-bold text-foreground">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
