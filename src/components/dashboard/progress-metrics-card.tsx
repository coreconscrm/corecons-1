import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientList } from "@/components/dashboard/active-courses-card";
import { ProjectList } from "@/components/dashboard/performance-chart";
import { ProviderList } from "@/components/dashboard/tasks-card";
import { TeamList } from "@/components/dashboard/study-time-analysis-card";
import { FormsResponses } from "@/components/dashboard/recent-achievements-card";

export function DashboardTabs({ clients, projects, providers, onAddClient, onAddProject, onAddProvider }: {
    clients: any[],
    projects: any[],
    providers: any[],
    onAddClient: (client: any) => void,
    onAddProject: (project: any) => void,
    onAddProvider: (provider: any) => void,
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
        <ProjectList projects={projects} clients={clients} onAddProject={onAddProject} />
      </TabsContent>
      <TabsContent value="clients">
        <ClientList clients={clients} onAddClient={onAddClient} />
      </TabsContent>
      <TabsContent value="providers">
        <ProviderList providers={providers} onAddProvider={onAddProvider} />
      </TabsContent>
      <TabsContent value="team">
        <TeamList />
      </TabsContent>
      <TabsContent value="forms">
        <FormsResponses />
      </TabsContent>
    </Tabs>
  );
}
