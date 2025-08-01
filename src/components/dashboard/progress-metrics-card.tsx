
"use client";

import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsSection } from "@/components/dashboard/clients-section";
import { ProviderSection } from "@/components/dashboard/tasks-card";
import { FormsSection } from "@/components/dashboard/recent-achievements-card";
import { SettingsCard } from "@/components/dashboard/settings-card";
import { BudgetSection } from "@/components/dashboard/budgets-card";
import { CompanySection } from "@/components/dashboard/company-card";
import { SeguimientoListCard } from "./seguimiento-card";
import { AiSection, type AiBudgetItem } from "./ai-section";
import { OfficeSection } from "./office-section";
import type { BudgetCategory } from "./budgets-card";
import type { JuanFranNote } from "./juanfran-notes-card";
import type { SandraNote } from './sandra-notes-card';
import type { JordanItem } from './jordan-checklist-card';
import type { DaniPriority } from './dani-priorities-card';

const ProjectListCard = dynamic(() => import('@/components/dashboard/performance-chart').then(mod => mod.ProjectListCard), { ssr: false });

export function DashboardTabs({
    activeTab, onTabChange,
    clients, onAddClient, onUpdateClient, onDeleteClient, onCreateBudgetFromClient, onCreateSeguimientoFromClient,
    reformas, onAddReforma, onUpdateReforma, onDeleteReforma,
    projects, onAddProject, onUpdateProject, onDeleteProject,
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator,
    interioristas, onAddInteriorista, onUpdateInteriorista, onDeleteInteriorista,
    constructoras, onAddConstructora, onUpdateConstructora, onDeleteConstructora,
    reformistas, onAddReformista, onUpdateReformista, onDeleteReformista,
    inmobiliarias, onAddInmobiliaria, onUpdateInmobiliaria, onDeleteInmobiliaria,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    contacts, onAddContact, onUpdateContact, onDeleteContact,
    forms, onLoadForms, onUpdateForm, onDeleteForm,
    priorityCalls, onAddPriorityCall, onUpdatePriorityCall, onDeletePriorityCall,
    budgets, onAddBudget, onUpdateBudget, onDeleteBudget,
    companies, onAddCompany, onUpdateCompany, onDeleteCompany,
    documents, onAddDocument, onDeleteDocument,
    seguimientos, onAddSeguimiento, onUpdateSeguimiento, onDeleteSeguimiento,
    estadoOptions, porHacerOptions, seguimientoCategories, onSeguimientoOptionsChange,
    juanfranNotes, onAddJuanfranNote, onUpdateJuanfranNote, onDeleteJuanfranNote,
    sandraNotes, onAddSandraNote, onUpdateSandraNote, onDeleteSandraNote,
    jordanChecklists, onAddJordanChecklist, onUpdateJordanChecklist, onDeleteJordanChecklist,
    daniPriorities, onAddDaniPriority, onUpdateDaniPriority, onDeleteDaniPriority,
    chatMessages, onAddChatMessage, onUpdateChatMessage, onDeleteChatMessage,
    onCreateBudgetFromAi,
    visibleTabs, onTabVisibilityChange,
    sheetUrl, onSaveSheetUrl
}: {
    activeTab: string, onTabChange: (tab: string) => void,
    clients: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void, onCreateBudgetFromClient: (client: any, category: BudgetCategory) => void, onCreateSeguimientoFromClient: (client: any) => void,
    reformas: any[], onAddReforma: (reforma: any) => void, onUpdateReforma: (reforma: any) => void, onDeleteReforma: (id: any) => void,
    projects: any[], onAddProject: (project: any) => void, onUpdateProject: (project: any) => void, onDeleteProject: (id: any) => void,
    providers: any[], onAddProvider: (provider: any) => void, onUpdateProvider: (provider: any) => void, onDeleteProvider: (id: any) => void,
    collaborators: any[], onAddCollaborator: (c: any) => void, onUpdateCollaborator: (c: any) => void, onDeleteCollaborator: (id: string) => void,
    interioristas: any[], onAddInteriorista: (c: any) => void, onUpdateInteriorista: (c: any) => void, onDeleteInteriorista: (id: string) => void,
    constructoras: any[], onAddConstructora: (c: any) => void, onUpdateConstructora: (c: any) => void, onDeleteConstructora: (id: string) => void,
    reformistas: any[], onAddReformista: (c: any) => void, onUpdateReformista: (c: any) => void, onDeleteReformista: (id: string) => void,
    inmobiliarias: any[], onAddInmobiliaria: (c: any) => void, onUpdateInmobiliaria: (c: any) => void, onDeleteInmobiliaria: (id: string) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    contacts: any[], onAddContact: (contact: any) => void, onUpdateContact: (contact: any) => void, onDeleteContact: (id: any) => void,
    forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
    priorityCalls: any[], onAddPriorityCall: (call: any) => void, onUpdatePriorityCall: (call: any) => void, onDeletePriorityCall: (id: string) => void,
    budgets: any[], onAddBudget: (budget: any) => void, onUpdateBudget: (budget: any) => void, onDeleteBudget: (id: any) => void,
    companies: any[], onAddCompany: (company: any) => Promise<void>, onUpdateCompany: (company: any) => Promise<void>, onDeleteCompany: (id: any) => void,
    documents: any[], onAddDocument: (doc: any) => void, onDeleteDocument: (id: string) => void,
    seguimientos: any[], onAddSeguimiento: (s: any) => void, onUpdateSeguimiento: (s: any) => void, onDeleteSeguimiento: (id: string) => void,
    estadoOptions: string[], porHacerOptions: string[], seguimientoCategories: string[], onSeguimientoOptionsChange: (type: 'estado' | 'porHacer' | 'categories', options: string[]) => void,
    juanfranNotes: JuanFranNote[], onAddJuanfranNote: (note: any) => void, onUpdateJuanfranNote: (note: any) => void, onDeleteJuanfranNote: (id: string) => void,
    sandraNotes: SandraNote[], onAddSandraNote: (note: any) => void, onUpdateSandraNote: (note: any) => void, onDeleteSandraNote: (id: string) => void,
    jordanChecklists: JordanItem[], onAddJordanChecklist: (c: any) => void, onUpdateJordanChecklist: (c: any) => void, onDeleteJordanChecklist: (id: string) => void,
    daniPriorities: DaniPriority[], onAddDaniPriority: (p: any) => void, onUpdateDaniPriority: (p: any) => void, onDeleteDaniPriority: (id: string) => void,
    chatMessages: any[], onAddChatMessage: (msg: any) => void, onUpdateChatMessage: (msg: any) => void, onDeleteChatMessage: (id: string) => void,
    onCreateBudgetFromAi: (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas') => void,
    visibleTabs: any, onTabVisibilityChange: (tabs: any) => void,
    sheetUrl: string, onSaveSheetUrl: (url: string) => void
}) {
  
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
        <OfficeSection 
            juanfranNotes={juanfranNotes}
            onAddJuanfranNote={onAddJuanfranNote}
            onUpdateJuanfranNote={onUpdateJuanfranNote}
            onDeleteJuanfranNote={onDeleteJuanfranNote}
            sandraNotes={sandraNotes}
            onAddSandraNote={onAddSandraNote}
            onUpdateSandraNote={onUpdateSandraNote}
            onDeleteSandraNote={onDeleteSandraNote}
            jordanChecklists={jordanChecklists}
            onAddJordanChecklist={onAddJordanChecklist}
            onUpdateJordanChecklist={onUpdateJordanChecklist}
            onDeleteJordanChecklist={onDeleteJordanChecklist}
            daniPriorities={daniPriorities}
            onAddDaniPriority={onAddDaniPriority}
            onUpdateDaniPriority={onUpdateDaniPriority}
            onDeleteDaniPriority={onDeleteDaniPriority}
            chatMessages={chatMessages}
            team={team}
            onAddChatMessage={onAddChatMessage}
            onUpdateChatMessage={onUpdateChatMessage}
            onDeleteChatMessage={onDeleteChatMessage}
        />
      </TabsContent>}

      {visibleTabs.seguimiento && <TabsContent value="seguimiento">
        <div className="mt-6">
         <SeguimientoListCard 
            seguimientos={seguimientos} 
            onAddSeguimiento={onAddSeguimiento} 
            onUpdateSeguimiento={onUpdateSeguimiento} 
            onDeleteSeguimiento={onDeleteSeguimiento}
            estadoOptions={estadoOptions}
            porHacerOptions={porHacerOptions}
            categories={seguimientoCategories}
            onSeguimientoOptionsChange={onSeguimientoOptionsChange}
          />
        </div>
      </TabsContent>}

      {(visibleTabs.clients || visibleTabs.reformas) && <TabsContent value="clients" className="mt-6">
        <ClientsSection
            clients={clients}
            providers={providers}
            onAddClient={onAddClient}
            onUpdateClient={onUpdateClient}
            onDeleteClient={onDeleteClient}
            onCreateBudgetFromClient={onCreateBudgetFromClient}
            onCreateSeguimientoFromClient={onCreateSeguimientoFromClient}
            reformas={reformas}
            onAddReforma={onAddReforma}
            onUpdateReforma={onUpdateReforma}
            onDeleteReforma={onDeleteReforma}
            visibleTabs={visibleTabs}
        />
      </TabsContent>}

      {visibleTabs.projects && <TabsContent value="projects">
        <div className="mt-6">
         <ProjectListCard projects={projects} clients={[...clients, ...reformas]} providers={providers} onAddProject={onAddProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} />
        </div>
      </TabsContent>}

      {visibleTabs.budgets && <TabsContent value="budgets" className="mt-6">
        <BudgetSection budgets={budgets} clients={[...clients, ...reformas]} companies={companies} onAddBudget={onAddBudget} onUpdateBudget={onUpdateBudget} onDeleteBudget={onDeleteBudget} />
      </TabsContent>}

      {(visibleTabs.providers || visibleTabs.collaborators || visibleTabs.interioristas || visibleTabs.prices) && <TabsContent value="providers" className="mt-6">
         <ProviderSection
          providers={providers}
          onAddProvider={onAddProvider}
          onUpdateProvider={onUpdateProvider}
          onDeleteProvider={onDeleteProvider}
          collaborators={collaborators}
          onAddCollaborator={onAddCollaborator}
          onUpdateCollaborator={onUpdateCollaborator}
          onDeleteCollaborator={onDeleteCollaborator}
          interioristas={interioristas}
          onAddInteriorista={onAddInteriorista}
          onUpdateInteriorista={onUpdateInteriorista}
          onDeleteInteriorista={onDeleteInteriorista}
          constructoras={constructoras}
          onAddConstructora={onAddConstructora}
          onUpdateConstructora={onUpdateConstructora}
          onDeleteConstructora={onDeleteConstructora}
          reformistas={reformistas}
          onAddReformista={onAddReformista}
          onUpdateReformista={onUpdateReformista}
          onDeleteReformista={onDeleteReformista}
          inmobiliarias={inmobiliarias}
          onAddInmobiliaria={onAddInmobiliaria}
          onUpdateInmobiliaria={onUpdateInmobiliaria}
          onDeleteInmobiliaria={onDeleteInmobiliaria}
          visibleTabs={visibleTabs}
        />
      </TabsContent>}
      
      {visibleTabs.forms && <TabsContent value="forms" className="mt-6">
        <FormsSection 
          contacts={contacts}
          onAddContact={onAddContact}
          onUpdateContact={onUpdateContact}
          onDeleteContact={onDeleteContact}
          onAddClient={onAddClient}
          onAddReforma={onAddReforma}
          forms={forms} 
          onLoadForms={onLoadForms} 
          onUpdateForm={onUpdateForm} 
          onDeleteForm={onDeleteForm} 
          sheetUrl={sheetUrl}
          onSaveSheetUrl={onSaveSheetUrl}
          priorityCalls={priorityCalls}
          onAddPriorityCall={onAddPriorityCall}
          onUpdatePriorityCall={onUpdatePriorityCall}
          onDeletePriorityCall={onDeletePriorityCall}
        />
      </TabsContent>}

      {visibleTabs.ia && <TabsContent value="ia" className="mt-6">
        <AiSection companies={companies} forms={forms} onCreateBudgetFromAi={onCreateBudgetFromAi} />
      </TabsContent>}

      {(visibleTabs.companies || visibleTabs.team) && <TabsContent value="companies" className="mt-6">
        <CompanySection
            companies={companies}
            onAddCompany={onAddCompany}
            onUpdateCompany={onUpdateCompany}
            onDeleteCompany={onDeleteCompany}
            documents={documents}
            onAddDocument={onAddDocument}
            onDeleteDocument={onDeleteDocument}
            team={team}
            onAddTeamMember={onAddTeamMember}
            onUpdateTeamMember={onUpdateTeamMember}
            onDeleteTeamMember={onDeleteTeamMember}
            visibleTabs={visibleTabs}
        />
      </TabsContent>}

      <TabsContent value="settings" className="mt-6">
        <SettingsCard visibleTabs={visibleTabs} onTabVisibilityChange={onTabVisibilityChange} />
      </TabsContent>
    </Tabs>
  );
}
