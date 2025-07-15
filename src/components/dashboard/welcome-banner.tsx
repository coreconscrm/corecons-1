import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Construction, 
    CheckCircle, 
    FileSignature, 
    FileClock, 
    ThumbsUp, 
    ThumbsDown, 
    Users, 
    PhoneCall, 
    PhoneOff 
} from "lucide-react";

function MetricBox({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: number }) {
  return (
    <div className="p-4 rounded-lg bg-secondary/50 dark:bg-secondary space-y-2 transition-transform duration-200 hover:scale-105 hover:shadow-md flex-1 basis-28">
      <Icon className="h-8 w-8 text-primary mx-auto" />
      <p className="text-3xl font-bold text-foreground">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProjectOverview({ signed, inProgress, completed }: { signed: number, inProgress: number, completed: number }) {
  const metrics = [
    { icon: FileSignature, label: "Proyectos Firmados", value: signed },
    { icon: Construction, label: "En Proceso", value: inProgress },
    { icon: CheckCircle, label: "Finalizados", value: completed },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Proyectos</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap justify-center gap-4 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}

export function BudgetOverview({ pending, accepted, rejected }: { pending: number, accepted: number, rejected: number }) {
  const metrics = [
    { icon: FileClock, label: "Pendientes", value: pending },
    { icon: ThumbsUp, label: "Aceptados", value: accepted },
    { icon: ThumbsDown, label: "Rechazados", value: rejected },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Presupuestos</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap justify-center gap-4 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormOverview({ total, called, pending }: { total: number, called: number, pending: number }) {
  const metrics = [
    { icon: Users, label: "Total Formularios", value: total },
    { icon: PhoneCall, label: "Llamados (Manual/Prio)", value: called },
    { icon: PhoneOff, label: "Pendientes (Manual/Prio)", value: pending },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Formularios</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap justify-center gap-4 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}
