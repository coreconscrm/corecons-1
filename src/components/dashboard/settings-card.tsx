"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ExternalLink, Volume2, Folder } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
      <CardContent className="pt-6">
         <div className="flex flex-col sm:flex-row items-center gap-4">
            <h3 className="text-lg font-semibold whitespace-nowrap">Recursos de Ayuda:</h3>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                    <a href="https://makebyjordan.com/wb/manual-de-usuario/manual-de-usuario-CRM-WB.html" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Manual de Usuario
                    </a>
                </Button>
                <Button variant="outline" asChild>
                    <a href="https://makebyjordan.com/wb/manual-de-usuario/Podcast-manual-de-usuario-CRM-WB.mp3" target="_blank" rel="noopener noreferrer">
                    <Volume2 className="mr-2 h-4 w-4" />
                    AudioManual de Usuario
                    </a>
                </Button>
                <Button variant="outline" asChild>
                    <a href="https://drive.google.com/drive/u/0/folders/1Tr9B5ILf8NwYqN9J7-Ouz3koxVNCN24m?lfhs=2" target="_blank" rel="noopener noreferrer">
                    <Folder className="mr-2 h-4 w-4" />
                    Carpeta Drive
                    </a>
                </Button>
                 <Button variant="outline" asChild>
                    <a href="https://drive.google.com/drive/u/0/folders/1piSqDZTPKZcqBTNI4bnaazLa0m-tah8K41fVz3r0YZ5GciI4RIQ_7awrYNUzM0z0ekr_g_nH?lfhs=2" target="_blank" rel="noopener noreferrer">
                    <Folder className="mr-2 h-4 w-4" />
                    Archivos enviados por Formulario
                    </a>
                </Button>
            </div>
        </div>
      </CardContent>

      <Separator />

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
