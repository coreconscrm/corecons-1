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
    companies: boolean;
    prices: boolean;
}

const tabLabels: Record<keyof VisibleTabs, string> = {
    projects: "Proyectos",
    budgets: "Presupuestos",
    clients: "Obra Nueva",
    providers: "Proveedores",
    prices: "Precios",
    team: "Equipo",
    forms: "Formularios",
    companies: "Empresas",
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
      </CardContent>
    </Card>
  );
}

    