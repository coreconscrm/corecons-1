import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase, Truck } from "lucide-react";

export function OverviewCard({ projects, clients, providers }: { projects: number, clients: number, providers: number }) {
  const metrics = [
    { icon: Briefcase, label: "Proyectos Activos", value: projects },
    { icon: Users, label: "Total Clientes", value: clients },
    { icon: Truck, label: "Proveedores Clave", value: providers },
  ];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
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
