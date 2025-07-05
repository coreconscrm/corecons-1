import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientListCard } from "@/components/dashboard/active-courses-card";
import { ProjectListCard } from "@/components/dashboard/performance-chart";
import { ProviderListCard } from "@/components/dashboard/tasks-card";
import { TeamListCard } from "@/components/dashboard/study-time-analysis-card";
import { FormsResponsesCard } from "@/components/dashboard/recent-achievements-card";

export function DashboardTabs({ 
    clients, onAddClient, onUpdateClient, onDeleteClient,
    projects, onAddProject, onUpdateProject, onDeleteProject,
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    forms, onUpdateForm, onDeleteForm
}: {
    clients: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void,
    projects: any[], onAddProject: (project: any) => void, onUpdateProject: (project: any) => void, onDeleteProject: (id: any) => void,
    providers: any[], onAddProvider: (provider: any) => void, onUpdateProvider: (provider: any) => void, onDeleteProvider: (id: any) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    forms: any[], onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
}) {
  return (
    <Tabs defaultValue="projects" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <TabsTrigger value="projects">Proyectos</TabsTrigger>
        <TabsTrigger value="clients">Clientes</TabsTrigger>
        <TabsTrigger value="providers">Proveedores</TabsTrigger>
        <TabsTrigger value="team">Equipo</TabsTrigger>
        <TabsTrigger value="forms">Formularios</TabsTrigger>
      </TabsList>
      <TabsContent value="projects">
        <ProjectListCard projects={projects} clients={clients} onAddProject={onAddProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} />
      </TabsContent>
      <TabsContent value="clients">
        <ClientListCard clients={clients} onAddClient={onAddClient} onUpdateClient={onUpdateClient} onDeleteClient={onDeleteClient} />
      </TabsContent>
      <TabsContent value="providers">
        <ProviderListCard providers={providers} onAddProvider={onAddProvider} onUpdateProvider={onUpdateProvider} onDeleteProvider={onDeleteProvider} />
      </TabsContent>
      <TabsContent value="team">
        <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
      </TabsContent>
      <TabsContent value="forms">
        <FormsResponsesCard forms={forms} onUpdateForm={onUpdateForm} onDeleteForm={onDeleteForm} />
      </TabsContent>
    </Tabs>
  );
}
