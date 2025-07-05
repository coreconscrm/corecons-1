import { Card, CardContent } from "@/components/ui/card";
import { Construction, CheckCircle, PhoneCall, FileClock, FileSignature } from "lucide-react";

export function OverviewCard({ 
    projectsInProgress, 
    projectsCompleted, 
    contactsCalled, 
    contactsInProcess, 
    contactsSigned 
}: { 
    projectsInProgress: number, 
    projectsCompleted: number, 
    contactsCalled: number, 
    contactsInProcess: number, 
    contactsSigned: number 
}) {
  const metrics = [
    { icon: Construction, label: "Proyectos en Progreso", value: projectsInProgress },
    { icon: CheckCircle, label: "Proyectos Completados", value: projectsCompleted },
    { icon: PhoneCall, label: "Contactos Llamados", value: contactsCalled },
    { icon: FileClock, label: "En Proceso", value: contactsInProcess },
    { icon: FileSignature, label: "Firmados", value: contactsSigned },
  ];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-secondary/50 dark:bg-secondary space-y-2 transition-transform duration-200 hover:scale-105 hover:shadow-md"
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
