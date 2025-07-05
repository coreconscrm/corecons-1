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
}

const tabLabels: Record<keyof VisibleTabs, string> = {
    projects: "Proyectos",
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
        {Object.keys(visibleTabs).map(tabKey => (
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
           <b>Nota sobre la personalización de campos:</b><br />
            Crear una herramienta para añadir, eliminar y modificar campos dinámicamente es una funcionalidad muy compleja, similar a construir una aplicación completamente nueva dentro de este CRM. Requiere cambios profundos en cómo se guardan y muestran los datos.
            <br/><br/>
            Por ahora, puedo ayudarte a realizar personalizaciones específicas directamente en el código. ¡Solo tienes que pedírmelo!
        </CardDescription>
      </CardContent>
    </Card>
  );
}
