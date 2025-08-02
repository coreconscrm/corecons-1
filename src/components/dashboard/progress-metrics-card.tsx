
"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsCard } from "@/components/dashboard/settings-card";
import { CompanySection } from "./company-card";
import { ClientsSection } from "./clients-section";
import { ProviderListCard } from "./tasks-card";
import { FormsSection } from "./recent-achievements-card";
import { BudgetSection } from "./budgets-card";
import { AiSection } from "./ai-section";
import { OfficeSection } from "./office-section";
import { SeguimientoListCard } from './seguimiento-card';

const ProjectListCard = dynamic(() => import('@/components/dashboard/performance-chart').then(mod => mod.ProjectListCard), { ssr: false });

export function DashboardTabs({
    activeTab, 
    onTabChange,
    visibleTabs, 
    onTabVisibilityChange,
    setOverviewData
}: {
    activeTab: string, 
    onTabChange: (tab: string) => void,
    visibleTabs: any, 
    onTabVisibilityChange: (tabs: any) => void,
    setOverviewData: (data: any) => void;
}) {

   useEffect(() => {
    const collectionsToWatch = [
        'budgets', 'forms', 'contacts', 'priority_calls', 'seguimientos', 
        'juanfran_notes', 'julian_notes', 'sandra_notes', 'jordan_checklists', 
        'dani_priorities', 'chat_messages'
    ];

    const unsubscribes = collectionsToWatch.map(c => {
        const q = query(collection(db, c));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setOverviewData((prevData: any) => ({
                ...prevData,
                [c]: data
            }));
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [setOverviewData]);

  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto md:justify-between">
        {visibleTabs.oficina && <TabsTrigger value="oficina">Oficina</TabsTrigger>}
        {visibleTabs.seguimiento && <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>}
        {(visibleTabs.clients || visibleTabs.reformas) && <TabsTrigger value="clients">Clientes</TabsTrigger>}
        {visibleTabs.projects && <TabsTrigger value="projects">Proyectos</TabsTrigger>}
        {visibleTabs.budgets && <TabsTrigger value="budgets">Presupuestos</TabsTrigger>}
        {(visibleTabs.providers || visibleTabs.collaborators || visibleTabs.interioristas || visibleTabs.constructoras || visibleTabs.reformistas || visibleTabs.prices) && <TabsTrigger value="providers">Proveedores</TabsTrigger>}
        {visibleTabs.forms && <TabsTrigger value="forms">Formularios</TabsTrigger>}
        {visibleTabs.ia && <TabsTrigger value="ia">IA</TabsTrigger>}
        {(visibleTabs.companies || visibleTabs.team) && <TabsTrigger value="companies">Empresa</TabsTrigger>}
        <TabsTrigger value="settings">Configuración</TabsTrigger>
      </TabsList>
      
      {visibleTabs.oficina && <TabsContent value="oficina" className="mt-6">
        <OfficeSection />
      </TabsContent>}

      {visibleTabs.seguimiento && <TabsContent value="seguimiento">
        <div className="mt-6">
            <SeguimientoSection />
        </div>
      </TabsContent>}

      {(visibleTabs.clients || visibleTabs.reformas) && <TabsContent value="clients" className="mt-6">
        <ClientsSection visibleTabs={visibleTabs}/>
      </TabsContent>}

      {visibleTabs.projects && <TabsContent value="projects">
        <div className="mt-6">
         {/* <ProjectListCard projects={projects} clients={[...clients, ...reformas]} providers={providers} onAddProject={onAddProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} /> */}
        </div>
      </TabsContent>}

      {visibleTabs.budgets && <TabsContent value="budgets" className="mt-6">
        <BudgetSection />
      </TabsContent>}

      {(visibleTabs.providers || visibleTabs.collaborators || visibleTabs.interioristas || visibleTabs.prices) && <TabsContent value="providers" className="mt-6">
         <ProviderListCard />
      </TabsContent>}
      
      {visibleTabs.forms && <TabsContent value="forms" className="mt-6">
        <FormsSection />
      </TabsContent>}

      {visibleTabs.ia && <TabsContent value="ia" className="mt-6">
        <AiSection />
      </TabsContent>}

      {(visibleTabs.companies || visibleTabs.team) && <TabsContent value="companies" className="mt-6">
        <CompanySection visibleTabs={visibleTabs}/>
      </TabsContent>}

      <TabsContent value="settings" className="mt-6">
        <SettingsCard visibleTabs={visibleTabs} onTabVisibilityChange={onTabVisibilityChange} />
      </TabsContent>
    </Tabs>
  );
}
