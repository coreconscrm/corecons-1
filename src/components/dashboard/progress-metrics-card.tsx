
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientListCard } from "@/components/dashboard/active-courses-card";
import { ProjectListCard } from "@/components/dashboard/performance-chart";
import { ProviderSection } from "@/components/dashboard/tasks-card";
import { TeamListCard } from "@/components/dashboard/study-time-analysis-card";
import { FormsResponsesCard } from "@/components/dashboard/recent-achievements-card";
import { SettingsCard } from "@/components/dashboard/settings-card";
import { BudgetListCard } from "@/components/dashboard/budgets-card";
import { CompanySection } from "@/components/dashboard/company-card";
import { PriceListCard } from "./prices-card";
import { ReformaListCard } from "./reformas-card";

export function DashboardTabs({
    activeTab, onTabChange,
    clients, onAddClient, onUpdateClient, onDeleteClient,
    reformas, onAddReforma, onUpdateReforma, onDeleteReforma,
    projects, onAddProject, onUpdateProject, onDeleteProject,
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    contacts, onAddContact, onUpdateContact, onDeleteContact,
    forms, onLoadForms, onUpdateForm, onDeleteForm,
    budgets, onAddBudget, onUpdateBudget, onDeleteBudget,
    companies, onAddCompany, onUpdateCompany, onDeleteCompany,
    documents, onAddDocument, onDeleteDocument,
    visibleTabs, onTabVisibilityChange,
    sheetUrl, onSaveSheetUrl
}: {
    activeTab: string, onTabChange: (tab: string) => void,
    clients: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void,
    reformas: any[], onAddReforma: (reforma: any) => void, onUpdateReforma: (reforma: any) => void, onDeleteReforma: (id: any) => void,
    projects: any[], onAddProject: (project: any) => void, onUpdateProject: (project: any) => void, onDeleteProject: (id: any) => void,
    providers: any[], onAddProvider: (provider: any) => void, onUpdateProvider: (provider: any) => void, onDeleteProvider: (id: any) => void,
    collaborators: any[], onAddCollaborator: (c: any) => void, onUpdateCollaborator: (c: any) => void, onDeleteCollaborator: (id: string) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    contacts: any[], onAddContact: (contact: any) => void, onUpdateContact: (contact: any) => void, onDeleteContact: (id: any) => void,
    forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
    budgets: any[], onAddBudget: (budget: any) => void, onUpdateBudget: (budget: any) => void, onDeleteBudget: (id: any) => void,
    companies: any[], onAddCompany: (company: any) => void, onUpdateCompany: (company: any) => void, onDeleteCompany: (id: any) => void,
    documents: any[], onAddDocument: (doc: any) => void, onDeleteDocument: (id: string) => void,
    visibleTabs: any, onTabVisibilityChange: (tabs: any) => void,
    sheetUrl: string, onSaveSheetUrl: (url: string) => void
}) {
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto md:justify-between">
        {visibleTabs.projects && <TabsTrigger value="projects">Proyectos</TabsTrigger>}
        {visibleTabs.budgets && <TabsTrigger value="budgets">Presupuestos</TabsTrigger>}
        {visibleTabs.clients && <TabsTrigger value="clients">Obra Nueva</TabsTrigger>}
        {visibleTabs.reformas && <TabsTrigger value="reformas">Reformas</TabsTrigger>}
        {(visibleTabs.providers || visibleTabs.collaborators) && <TabsTrigger value="providers">Proveedores</TabsTrigger>}
        {visibleTabs.prices && <TabsTrigger value="prices">Precios</TabsTrigger>}
        {visibleTabs.team && <TabsTrigger value="team">Equipo</TabsTrigger>}
        {visibleTabs.forms && <TabsTrigger value="forms">Formularios</TabsTrigger>}
        {visibleTabs.companies && <TabsTrigger value="companies">Empresa</TabsTrigger>}
        <TabsTrigger value="settings">Configuración</TabsTrigger>
      </TabsList>

      {visibleTabs.projects && <TabsContent value="projects">
        <div className="mt-6">
         <ProjectListCard projects={projects} clients={clients} providers={providers} onAddProject={onAddProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} />
        </div>
      </TabsContent>}

      {visibleTabs.budgets && <TabsContent value="budgets" className="mt-6">
        <BudgetListCard budgets={budgets} clients={[...clients, ...reformas]} companies={companies} onAddBudget={onAddBudget} onUpdateBudget={onUpdateBudget} onDeleteBudget={onDeleteBudget} />
      </TabsContent>}
      
      {visibleTabs.clients && <TabsContent value="clients" className="mt-6">
        <ClientListCard clients={clients} providers={providers} onAddClient={onAddClient} onUpdateClient={onUpdateClient} onDeleteClient={onDeleteClient} />
      </TabsContent>}
      
      {visibleTabs.reformas && <TabsContent value="reformas" className="mt-6">
        <ReformaListCard reformas={reformas} providers={providers} onAddReforma={onAddReforma} onUpdateReforma={onUpdateReforma} onDeleteReforma={onDeleteReforma} />
      </TabsContent>}

      {(visibleTabs.providers || visibleTabs.collaborators) && <TabsContent value="providers" className="mt-6">
         <ProviderSection
          providers={providers}
          onAddProvider={onAddProvider}
          onUpdateProvider={onUpdateProvider}
          onDeleteProvider={onDeleteProvider}
          collaborators={collaborators}
          onAddCollaborator={onAddCollaborator}
          onUpdateCollaborator={onUpdateCollaborator}
          onDeleteCollaborator={onDeleteCollaborator}
          visibleTabs={visibleTabs}
        />
      </TabsContent>}
      
      {visibleTabs.prices && <TabsContent value="prices" className="mt-6">
        <PriceListCard providers={providers} />
      </TabsContent>}

      {visibleTabs.team && <TabsContent value="team" className="mt-6">
        <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
      </TabsContent>}
      
      {visibleTabs.forms && <TabsContent value="forms" className="mt-6">
        <FormsResponsesCard 
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
        />
      </TabsContent>}

      {visibleTabs.companies && <TabsContent value="companies" className="mt-6">
        <CompanySection
            companies={companies}
            onAddCompany={onAddCompany}
            onUpdateCompany={onUpdateCompany}
            onDeleteCompany={onDeleteCompany}
            documents={documents}
            onAddDocument={onAddDocument}
            onDeleteDocument={onDeleteDocument}
        />
      </TabsContent>}

      <TabsContent value="settings" className="mt-6">
        <SettingsCard visibleTabs={visibleTabs} onVisibilityChange={onTabVisibilityChange} />
      </TabsContent>
    </Tabs>
  );
}
