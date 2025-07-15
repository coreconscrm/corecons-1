
"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type VisibleTabs = {
    projects: boolean;
    clients: boolean;
    reformas: boolean;
    providers: boolean;
    collaborators: boolean;
    interioristas: boolean;
    constructoras: boolean;
    reformistas: boolean;
    inmobiliarias: boolean;
    team: boolean;
    forms: boolean;
    budgets: boolean;
    companies: boolean;
    prices: boolean;
    seguimiento: boolean;
}

const tabLabels: Record<keyof VisibleTabs, string> = {
    seguimiento: "Seguimiento",
    clients: "Clientes (Obra Nueva)",
    reformas: "Clientes (Reformas)",
    projects: "Proyectos",
    budgets: "Presupuestos",
    providers: "Proveedores",
    collaborators: "Proveedores (Arquitectos)",
    interioristas: "Proveedores (Interioristas)",
    constructoras: "Proveedores (Constructoras)",
    reformistas: "Proveedores (Reformistas)",
    inmobiliarias: "Proveedores (Inmobiliarias)",
    prices: "Proveedores (Base de Precios)",
    team: "Empresa (Equipo)",
    forms: "Formularios",
    companies: "Empresa (Perfiles y Docs)",
};

export function SettingsCard({ visibleTabs, onVisibilityChange }: { visibleTabs: VisibleTabs, onVisibilityChange: (fn: (prev: VisibleTabs) => VisibleTabs) => void }) {
  
  const handleToggle = (tabName: keyof VisibleTabs) => {
    onVisibilityChange(prev => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  // Create a sorted list of labels for consistent rendering
  const sortedTabLabels = Object.entries(tabLabels).sort(([, a], [, b]) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Visibilidad</CardTitle>
        <CardDescription>Selecciona las pestañas y sub-pestañas que deseas mostrar en el panel de control.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {sortedTabLabels.map(([tabKey, label]) => (
            <div key={tabKey} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary">
                <Label htmlFor={`${tabKey}-switch`} className="text-base cursor-pointer">
                    {label}
                </Label>
                <Switch 
                    id={`${tabKey}-switch`} 
                    checked={visibleTabs[tabKey as keyof VisibleTabs]} 
                    onCheckedChange={() => handleToggle(tabKey as keyof VisibleTabs)} 
                />
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
