"use client";

import { useState } from 'react';
import { Header } from "@/components/dashboard/header";
import { OverviewCard } from "@/components/dashboard/welcome-banner";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";

const initialClients = [
  { id: 'cli-1', name: 'Constructora Central', contact: 'Juan Pérez', email: 'juan.perez@constructora.com', phone: '555-1234' },
  { id: 'cli-2', name: 'Inmobiliaria Futuro', contact: 'Ana Gómez', email: 'ana.gomez@infuturo.es', phone: '555-5678' },
];

const initialProjects = [
  { id: 'pro-1', name: 'Residencial Los Robles', clientId: 'cli-1', status: 'En progreso', budget: 500000, documentation: [], plan: null, photos: [] },
  { id: 'pro-2', name: 'Edificio de Oficinas Metrópolis', clientId: 'cli-2', status: 'Completado', budget: 1200000, documentation: [{name: 'Planos Finales.pdf', url: '#'}], plan: {url: '#'}, photos: ['https://placehold.co/600x400.png'] },
];

const initialProviders = [
  { id: 'prov-1', name: 'Cementos Fortaleza', contact: 'Carlos Ruiz', phone: '555-8765', discount: '10%' },
  { id: 'prov-2', name: 'Aceros del Norte', contact: 'Luisa Fernández', phone: '555-4321', discount: '15%' },
];

export default function CrmPage() {
  const [clients, setClients] = useState(initialClients);
  const [projects, setProjects] = useState(initialProjects);
  const [providers, setProviders] = useState(initialProviders);

  const addClient = (client: any) => {
    setClients(prev => [...prev, { ...client, id: `cli-${Date.now()}` }]);
  };

  const addProject = (project: any) => {
    setProjects(prev => [...prev, { ...project, id: `pro-${Date.now()}`, documentation: [], plan: null, photos: [] }]);
  };

  const addProvider = (provider: any) => {
    setProviders(prev => [...prev, { ...provider, id: `prov-${Date.now()}` }]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <OverviewCard projects={projects.length} clients={clients.length} providers={providers.length} />
          <DashboardTabs
            clients={clients}
            projects={projects}
            providers={providers}
            onAddClient={addClient}
            onAddProject={addProject}
            onAddProvider={addProvider}
          />
        </div>
      </main>
    </div>
  );
}
