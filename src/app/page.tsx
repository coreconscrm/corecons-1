"use client";

import { useState } from 'react';
import { Header } from "@/components/dashboard/header";
import { OverviewCard } from "@/components/dashboard/welcome-banner";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const initialClients = [
  { id: 'cli-1', name: 'Constructora Central', contact: 'Juan Pérez', email: 'juan.perez@constructora.com', phone: '555-1234' },
  { id: 'cli-2', name: 'Inmobiliaria Futuro', contact: 'Ana Gómez', email: 'ana.gomez@infuturo.es', phone: '555-5678' },
];

const initialProjects = [
  { id: 'pro-1', name: 'Residencial Los Robles', clientId: 'cli-1', status: 'En progreso', budget: 500000, documentation: [], plan: null, photos: [], ganttData: [], providerIds: ['prov-1'] },
  { id: 'pro-2', name: 'Edificio de Oficinas Metrópolis', clientId: 'cli-2', status: 'Completado', budget: 1200000, documentation: [{name: 'Planos Finales.pdf', url: '#'}], plan: {url: '#'}, photos: ['https://placehold.co/600x400.png'], ganttData: [{name: "Cimentación", days: 15}, {name: "Estructura", days: 30}, {name: "Acabados", days: 25}], providerIds: ['prov-1', 'prov-2'] },
];

const initialProviders = [
  { id: 'prov-1', name: 'Cementos Fortaleza', contact: 'Carlos Ruiz', phone: '555-8765', discount: '10%', specialization: 'Materiales de obra' },
  { id: 'prov-2', name: 'Aceros del Norte', contact: 'Luisa Fernández', phone: '555-4321', discount: '15%', specialization: 'Estructuras metálicas' },
];

const initialTeamMembers = [
  { id: 'team-1', name: 'Elena García', role: 'Jefa de Proyecto', avatar: 'https://placehold.co/40x40.png', hint: 'woman portrait' },
  { id: 'team-2', name: 'Miguel Torres', role: 'Arquitecto Principal', avatar: 'https://placehold.co/40x40.png', hint: 'man portrait' },
  { id: 'team-3', name: 'Sofía Romero', role: 'Administración', avatar: 'https://placehold.co/40x40.png', hint: 'person glasses' },
];

const initialFormSubmissions = [
  { id: 1, name: 'Pedro Perez', email: 'p.perez@email.com', phone: '123-456-789', date: '2024-07-21', status: 'Contactado' },
  { id: 2, name: 'Ana García', email: 'a.garcia@email.com', phone: '987-654-321', date: '2024-07-20', status: 'Pendiente' },
  { id: 3, name: 'Laura Martín', email: 'laura.m@example.com', phone: '555-555-555', date: '2024-07-19', status: 'Pendiente' },
];


export default function CrmPage() {
  const [clients, setClients] = useState(initialClients);
  const [projects, setProjects] = useState(initialProjects);
  const [providers, setProviders] = useState(initialProviders);
  const [team, setTeam] = useState(initialTeamMembers);
  const [forms, setForms] = useState(initialFormSubmissions);
  const [visibleTabs, setVisibleTabs] = useState({
    projects: true,
    clients: true,
    providers: true,
    team: true,
    forms: true,
  });
  const [activeTab, setActiveTab] = useState("projects");
  const { toast } = useToast();

  const handleCreate = (setter: Function, item: any, type: string) => {
    setter((prev: any[]) => [...prev, { ...item, id: `${type.slice(0,4)}-${Date.now()}` }]);
    toast({ title: `${type} añadido`, description: `El ${type.toLowerCase()} ha sido creado con éxito.` });
  };

  const handleUpdate = (setter: Function, updatedItem: any, type: string) => {
    setter((prev: any[]) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    toast({ title: `${type} actualizado`, description: `El ${type.toLowerCase()} ha sido actualizado.` });
  };
  
  const handleDelete = (setter: Function, id: any, type: string) => {
    setter((prev: any[]) => prev.filter(item => item.id !== id));
    toast({ title: `${type} eliminado`, description: `El ${type.toLowerCase()} ha sido eliminado.`, variant: 'destructive' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setActiveTab("settings")} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <OverviewCard projects={projects.length} clients={clients.length} providers={providers.length} />
          <DashboardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}

            clients={clients}
            onAddClient={(client) => handleCreate(setClients, client, 'Cliente')}
            onUpdateClient={(client) => handleUpdate(setClients, client, 'Cliente')}
            onDeleteClient={(id) => handleDelete(setClients, id, 'Cliente')}

            projects={projects}
            onAddProject={(project) => handleCreate(setProjects, {...project, documentation: [], photos: [], ganttData: [], providerIds: []}, 'Proyecto')}
            onUpdateProject={(project) => handleUpdate(setProjects, project, 'Proyecto')}
            onDeleteProject={(id) => handleDelete(setProjects, id, 'Proyecto')}

            providers={providers}
            onAddProvider={(provider) => handleCreate(setProviders, provider, 'Proveedor')}
            onUpdateProvider={(provider) => handleUpdate(setProviders, provider, 'Proveedor')}
            onDeleteProvider={(id) => handleDelete(setProviders, id, 'Proveedor')}

            team={team}
            onAddTeamMember={(member) => handleCreate(setTeam, member, 'Miembro')}
            onUpdateTeamMember={(member) => handleUpdate(setTeam, member, 'Miembro')}
            onDeleteTeamMember={(id) => handleDelete(setTeam, id, 'Miembro')}

            forms={forms}
            onUpdateForm={(form) => handleUpdate(setForms, form, 'Formulario')}
            onDeleteForm={(id) => handleDelete(setForms, id, 'Formulario')}

            visibleTabs={visibleTabs}
            onTabVisibilityChange={setVisibleTabs}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
