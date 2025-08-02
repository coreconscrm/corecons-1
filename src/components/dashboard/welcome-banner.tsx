import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    CheckCircle, 
    FileSignature, 
    FileClock, 
    ThumbsUp, 
    ThumbsDown, 
    Users, 
    PhoneCall, 
    PhoneOff,
    Building,
    Map,
    CalendarCheck,
    ListTodo,
    NotebookText,
    MessageSquareWarning
} from "lucide-react";


function MetricBox({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: number }) {
  return (
    <div className="p-2 rounded-lg bg-secondary/50 dark:bg-secondary space-y-1 transition-transform duration-200 hover:scale-105 flex-1 basis-24 border border-transparent metric-box">
      <Icon className="h-6 w-6 text-primary mx-auto" />
      <p className="text-2xl font-bold text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function OficinaOverview({ juanfran, sandra, jordan, dani, chats, julian }: { juanfran: number, sandra: number, jordan: number, dani: number, chats: number, julian: number }) {
    const metrics = [
      { icon: NotebookText, label: "Juanfran", value: juanfran },
      { icon: NotebookText, label: "Julian", value: julian },
      { icon: NotebookText, label: "Sandra", value: sandra },
      { icon: NotebookText, label: "Jordan", value: jordan },
      { icon: NotebookText, label: "Dani", value: dani },
      { icon: MessageSquareWarning, label: "Chats", value: chats },
    ];
    return (
      <Card className="overview-card">
        <CardHeader>
          <CardTitle className="text-base">Resumen de Oficina</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex flex-wrap justify-center gap-2 text-center">
            {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
          </div>
        </CardContent>
      </Card>
    );
  }

export function SeguimientoOverview({ llamarEstaSemana, totalSeguimientos, ofrecerArquitecto, buscarTerreno }: { llamarEstaSemana: number, totalSeguimientos: number, ofrecerArquitecto: number, buscarTerreno: number }) {
  const metrics = [
    { icon: CalendarCheck, label: "Llamar s.", value: llamarEstaSemana },
    { icon: ListTodo, label: "Total", value: totalSeguimientos },
    { icon: Building, label: "Arquitecto", value: ofrecerArquitecto },
    { icon: Map, label: "Terreno", value: buscarTerreno },
  ];
  return (
    <Card className="overview-card">
      <CardHeader>
        <CardTitle className="text-base">Resumen de Seguimiento</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex flex-wrap justify-center gap-2 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}


export function BudgetOverview({ pending, accepted, rejected, done, sent }: { pending: number, accepted: number, rejected: number, done: number, sent: number }) {
  const metrics = [
    { icon: FileClock, label: "Pendientes", value: pending },
    { icon: FileSignature, label: "Enviados", value: sent },
    { icon: ThumbsUp, label: "Aceptados", value: accepted },
    { icon: ThumbsDown, label: "Rechazados", value: rejected },
    { icon: CheckCircle, label: "Hechos", value: done },
  ];
  return (
    <Card className="overview-card">
      <CardHeader>
        <CardTitle className="text-base">Resumen de Presupuestos</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex flex-wrap justify-center gap-2 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormOverview({ total, called, pending }: { total: number, called: number, pending: number }) {
  const metrics = [
    { icon: Users, label: "Formularios", value: total },
    { icon: PhoneCall, label: "Llamados", value: called },
    { icon: PhoneOff, label: "Pendientes", value: pending },
  ];
  return (
    <Card className="overview-card">
      <CardHeader>
        <CardTitle className="text-base">Resumen de Formularios</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex flex-wrap justify-center gap-2 text-center">
          {metrics.map((metric, index) => <MetricBox key={index} {...metric} />)}
        </div>
      </CardContent>
    </Card>
  );
}
