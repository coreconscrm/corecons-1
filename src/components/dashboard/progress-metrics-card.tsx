import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientListCard } from "@/components/dashboard/active-courses-card";
import { ProjectListCard } from "@/components/dashboard/performance-chart";
import { ProviderListCard } from "@/components/dashboard/tasks-card";
import { TeamListCard } from "@/components/dashboard/study-time-analysis-card";
import { FormsResponsesCard } from "@/components/dashboard/recent-achievements-card";
import { SettingsCard } from "@/components/dashboard/settings-card";

export function DashboardTabs({
    activeTab, onTabChange,
    clients, onAddClient, onUpdateClient, onDeleteClient,
    projects, onAddProject, onUpdateProject, onDeleteProject,
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    forms, onLoadForms, onUpdateForm, onDeleteForm,
    visibleTabs, onTabVisibilityChange
}: {
    activeTab: string, onTabChange: (tab: string) => void,
    clients: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void,
    projects: any[], onAddProject: (project: any) => void, onUpdateProject: (project: any) => void, onDeleteProject: (id: any) => void,
    providers: any[], onAddProvider: (provider: any) => void, onUpdateProvider: (provider: any) => void, onDeleteProvider: (id: any) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
    visibleTabs: any, onTabVisibilityChange: (tabs: any) => void,
}) {
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
        {visibleTabs.projects && <TabsTrigger value="projects">Proyectos</TabsTrigger>}
        {visibleTabs.clients && <TabsTrigger value="clients">Clientes</TabsTrigger>}
        {visibleTabs.providers && <TabsTrigger value="providers">Proveedores</TabsTrigger>}
        {visibleTabs.team && <TabsTrigger value="team">Equipo</TabsTrigger>}
        {visibleTabs.forms && <TabsTrigger value="forms">Formularios</TabsTrigger>}
        <TabsTrigger value="settings">Configuración</TabsTrigger>
      </TabsList>

      {visibleTabs.projects && <TabsContent value="projects">
        <ProjectListCard projects={projects} clients={clients} providers={providers} onAddProject={onAddProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} />
      </TabsContent>}
      
      {visibleTabs.clients && <TabsContent value="clients">
        <ClientListCard clients={clients} onAddClient={onAddClient} onUpdateClient={onUpdateClient} onDeleteClient={onDeleteClient} />
      </TabsContent>}

      {visibleTabs.providers && <TabsContent value="providers">
        <ProviderListCard providers={providers} onAddProvider={onAddProvider} onUpdateProvider={onUpdateProvider} onDeleteProvider={onDeleteProvider} />
      </TabsContent>}

      {visibleTabs.team && <TabsContent value="team">
        <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
      </TabsContent>}
      
      {visibleTabs.forms && <TabsContent value="forms">
        <FormsResponsesCard forms={forms} onLoadForms={onLoadForms} onUpdateForm={onUpdateForm} onDeleteForm={onDeleteForm} />
      </TabsContent>}

      <TabsContent value="settings">
        <SettingsCard visibleTabs={visibleTabs} onVisibilityChange={onTabVisibilityChange} />
      </TabsContent>
    </Tabs>
  );
}
