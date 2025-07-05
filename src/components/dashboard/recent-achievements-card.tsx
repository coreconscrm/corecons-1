import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Award, Star, Zap } from "lucide-react";

const achievements = [
  { icon: Star, text: "¡Primera semana perfecta!" },
  { icon: Award, text: "Maestro del Cálculo" },
  { icon: Zap, text: "Racha de 5 días de estudio" },
];

export function RecentAchievementsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logros Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievements.map((ach, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary"
          >
            <div className="bg-secondary p-2 rounded-full">
              <ach.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-foreground text-sm">{ach.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
