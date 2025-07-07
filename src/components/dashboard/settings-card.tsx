"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type VisibleTabs = {
    projects: boolean;
    clients: boolean;
    providers: boolean;
    team: boolean;
    forms: boolean;
    budgets: boolean;
}

const tabLabels: Record<keyof VisibleTabs, string> = {
    projects: "Proyectos",
    budgets: "Presupuestos",
    clients: "Clientes",
    providers: "Proveedores",
    team: "Equipo",
    forms: "Formularios",
};

export function SettingsCard({ visibleTabs, onVisibilityChange }: { visibleTabs: VisibleTabs, onVisibilityChange: (fn: (prev: VisibleTabs) => VisibleTabs) => void }) {
  
  const handleToggle = (tabName: keyof VisibleTabs) => {
    onVisibilityChange(prev => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Visibilidad</CardTitle>
        <CardDescription>Selecciona las pestañas que deseas mostrar en el panel de control.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {Object.keys(tabLabels).map(tabKey => (
            <div key={tabKey} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary">
                <Label htmlFor={`${tabKey}-switch`} className="text-base cursor-pointer">
                    {tabLabels[tabKey as keyof VisibleTabs]}
                </Label>
                <Switch 
                    id={`${tabKey}-switch`} 
                    checked={visibleTabs[tabKey as keyof VisibleTabs]} 
                    onCheckedChange={() => handleToggle(tabKey as keyof VisibleTabs)} 
                />
            </div>
        ))}
        <CardDescription className="pt-6 text-xs italic text-center">
           <b>Nota sobre la personalización:</b><br />
            Crear herramientas para añadir campos dinámicamente o para guardar configuraciones globales (como los datos de la empresa para los presupuestos) es una funcionalidad compleja que requiere una base de datos.
            <br/><br/>
            Por ahora, he añadido los datos de tu empresa directamente en el diseño del presupuesto impreso. Si necesitas cambiar el logo, la dirección o las notas al pie, ¡solo tienes que pedírmelo y lo haré por ti en el código!
        </CardDescription>
      </CardContent>
    </Card>
  );
}
