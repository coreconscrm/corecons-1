
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsCard } from "@/components/dashboard/settings-card";
import { CompanySection } from "./company/company-section";
import { ClientsSection } from "./clients/clients-section";
import { ProviderSection } from "./providers/providers-section";
import { FormsSection } from "./forms/forms-section";
import { BudgetSection } from "./budgets/budgets-section";
import { AiSection } from "./ai/ai-section";
import { OfficeSection } from "./oficina/office-section";
import { SeguimientoSection } from './seguimiento/seguimiento-section';
import { ProjectListCard } from './projects/projects-section';
import { Timestamp } from "firebase/firestore";

export function DashboardTabs({
    activeTab, 
    onTabChange,
    visibleTabs, 
    onTabVisibilityChange,
    data,
    actions
}: {
    activeTab: string; 
    onTabChange: (tab: string) => void;
    visibleTabs: any; 
    onTabVisibilityChange: (tabs: any) => void;
    data: any;
    actions: any;
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
          juanfranNotes={data.juanfranNotes}
          onAddJuanfranNote={(note: any) => actions.createItem('juanfran_notes', note)}
          onUpdateJuanfranNote={(note: any) => actions.updateItem('juanfran_notes', note)}
          onDeleteJuanfranNote={(id: string) => actions.deleteItem('juanfran_notes', id)}
          sandraNotes={data.sandraNotes}
          onAddSandraNote={(note: any) => actions.createItem('sandra_notes', note)}
          onUpdateSandraNote={(note: any) => actions.updateItem('sandra_notes', note)}
          onDeleteSandraNote={(id: string) => actions.deleteItem('sandra_notes', id)}
          jordanChecklists={data.jordanChecklists}
          onAddJordanChecklist={(item: any) => actions.createItem('jordan_checklists', item)}
          onUpdateJordanChecklist={(item: any) => actions.updateItem('jordan_checklists', item)}
          onDeleteJordanChecklist={(id: string) => actions.deleteItem('jordan_checklists', id)}
          daniPriorities={data.daniPriorities}
          onAddDaniPriority={(p: any) => actions.createItem('dani_priorities', p)}
          onUpdateDaniPriority={(p: any) => actions.updateItem('dani_priorities', p)}
          onDeleteDaniPriority={(id: string) => actions.deleteItem('dani_priorities', id)}
          chatMessages={data.chatMessages}
          team={data.team}
          onAddChatMessage={(message: any) => actions.createItem('chat_messages', message)}
          onUpdateChatMessage={(message: any) => actions.updateItem('chat_messages', message)}
          onDeleteChatMessage={(id: string) => actions.deleteItem('chat_messages', id)}
          julianNotes={data.julianNotes}
          onAddJulianNote={(note: any) => actions.createItem('julian_notes', note)}
          onUpdateJulianNote={(note: any) => actions.updateItem('julian_notes', note)}
          onDeleteJulianNote={(id: string) => actions.deleteItem('julian_notes', id)}
        />
      </TabsContent>}

      {visibleTabs.seguimiento && <TabsContent value="seguimiento">
        <div className="mt-6">
           <SeguimientoSection
              seguimientos={data.seguimientos}
              onAddSeguimiento={(s: any) => actions.createItem('seguimientos', s)}
              onUpdateSeguimiento={(s: any) => actions.updateItem('seguimientos', s)}
              onDeleteSeguimiento={(id: string) => actions.deleteItem('seguimientos', id)}
              estadoOptions={data.seguimientoEstadoOptions}
              porHacerOptions={data.seguimientoPorHacerOptions}
              categories={data.seguimientoCategories}
              onSeguimientoOptionsChange={actions.handleSeguimientoOptionsChange}
           />
        </div>
      </TabsContent>}

      {(visibleTabs.clients || visibleTabs.reformas) && <TabsContent value="clients" className="mt-6">
        <ClientsSection 
            visibleTabs={visibleTabs}
            clients={data.clients}
            onAddClient={(client: any) => actions.createItem('clients', client)}
            onUpdateClient={(client: any) => actions.updateItem('clients', client)}
            onDeleteClient={(id: string) => actions.deleteItem('clients', id)}
            reformas={data.reformas}
            onAddReforma={(reforma: any) => actions.createItem('reformas', reforma)}
            onUpdateReforma={(reforma: any) => actions.updateItem('reformas', reforma)}
            onDeleteReforma={(id: string) => actions.deleteItem('reformas', id)}
            providers={data.providers}
            onCreateBudgetFromClient={actions.handleCreateBudgetFromClient}
            onCreateSeguimientoFromClient={actions.handleCreateSeguimientoFromClient}
        />
      </TabsContent>}

      {visibleTabs.projects && <TabsContent value="projects">
        <div className="mt-6">
         <ProjectListCard 
            projects={data.projects} 
            clients={[...data.clients, ...data.reformas]} 
            providers={data.providers} 
            onAddProject={(p: any) => actions.createItem('projects', p)}
            onUpdateProject={(p: any) => actions.updateItem('projects', p)} 
            onDeleteProject={(id: string) => actions.deleteItem('projects', id)} 
          />
        </div>
      </TabsContent>}

      {visibleTabs.budgets && <TabsContent value="budgets" className="mt-6">
        <BudgetSection 
          budgets={data.budgets}
          clients={[...data.clients, ...data.reformas]}
          companies={data.companies}
          onAddBudget={(b: any) => actions.createItem('budgets', b)}
          onUpdateBudget={(b: any) => actions.updateItem('budgets', b)}
          onDeleteBudget={(id: string) => actions.deleteItem('budgets', id)}
        />
      </TabsContent>}

      {(visibleTabs.providers || visibleTabs.collaborators || visibleTabs.interioristas || visibleTabs.prices) && <TabsContent value="providers" className="mt-6">
         <ProviderSection 
           visibleTabs={visibleTabs}
           providers={data.providers}
           onAddProvider={(p: any) => actions.createItem('providers', p)}
           onUpdateProvider={(p: any) => actions.updateItem('providers', p)}
           onDeleteProvider={(id: string) => actions.deleteItem('providers', id)}
           collaborators={data.collaborators}
           onAddCollaborator={(c: any) => actions.createItem('collaborators', c)}
           onUpdateCollaborator={(c: any) => actions.updateItem('collaborators', c)}
           onDeleteCollaborator={(id: string) => actions.deleteItem('collaborators', id)}
           interioristas={data.interioristas}
            onAddInteriorista={(i: any) => actions.createItem('interioristas', i)}
            onUpdateInteriorista={(i: any) => actions.updateItem('interioristas', i)}
            onDeleteInteriorista={(id: string) => actions.deleteItem('interioristas', id)}
           constructoras={data.constructoras}
            onAddConstructora={(c: any) => actions.createItem('constructoras', c)}
            onUpdateConstructora={(c: any) => actions.updateItem('constructoras', c)}
            onDeleteConstructora={(id: string) => actions.deleteItem('constructoras', id)}
           reformistas={data.reformistas}
            onAddReformista={(r: any) => actions.createItem('reformistas', r)}
            onUpdateReformista={(r: any) => actions.updateItem('reformistas', r)}
            onDeleteReformista={(id: string) => actions.deleteItem('reformistas', id)}
           inmobiliarias={data.inmobiliarias}
            onAddInmobiliaria={(i: any) => actions.createItem('inmobiliarias', i)}
            onUpdateInmobiliaria={(i: any) => actions.updateItem('inmobiliarias', i)}
            onDeleteInmobiliaria={(id: string) => actions.deleteItem('inmobiliarias', id)}
         />
      </TabsContent>}
      
      {visibleTabs.forms && <TabsContent value="forms" className="mt-6">
        <FormsSection 
          forms={data.forms}
          onDeleteForm={(id: string) => actions.deleteItem('forms', id)}
          contacts={data.contacts}
          onAddContact={(contact: any) => actions.createItem('contacts', {...contact, createdAt: Timestamp.now()})}
          onUpdateContact={(contact: any) => actions.updateItem('contacts', contact)}
          onDeleteContact={(id: string) => actions.deleteItem('contacts', id)}
          priorityCalls={data.priorityCalls}
          onAddPriorityCall={(call: any) => actions.createItem('priority_calls', {...call, createdAt: Timestamp.now()})}
          onUpdatePriorityCall={(call: any) => actions.updateItem('priority_calls', call)}
          onDeletePriorityCall={(id: string) => actions.deleteItem('priority_calls', id)}
          sheetUrl={data.sheetUrl}
          onSaveSheetUrl={actions.handleSaveSheetUrl}
          formCols={data.formCols}
          onFormColsChange={(cols: any) => actions.handleColumnConfigChange('forms', cols)}
          contactCols={data.contactCols}
          onContactColsChange={(cols: any) => actions.handleColumnConfigChange('contacts', cols)}
          priorityCols={data.priorityCols}
          onPriorityColsChange={(cols: any) => actions.handleColumnConfigChange('priority_calls', cols)}
          onCreateSeguimientoFromContact={actions.handleCreateSeguimientoFromContact}
          onLoadForms={actions.handleLoadForms}
        />
      </TabsContent>}

      {visibleTabs.ia && <TabsContent value="ia" className="mt-6">
        <AiSection 
          companies={data.companies}
          forms={[...data.forms, ...data.contacts, ...data.priorityCalls]}
          aiBudgets={data.aiBudgets}
          onAddAiBudget={(b: any) => actions.createItem('ia_budgets', b)}
          onUpdateAiBudget={(b: any) => actions.updateItem('ia_budgets', b)}
          onDeleteAiBudget={(id: string) => actions.deleteItem('ia_budgets', id)}
          onCreateBudgetFromAi={actions.handleCreateBudgetFromAi}
          onCreateSummaryBudgetFromAi={actions.handleCreateSummaryBudgetFromAi}
        />
      </TabsContent>}

      {(visibleTabs.companies || visibleTabs.team) && <TabsContent value="companies" className="mt-6">
        <CompanySection
          visibleTabs={visibleTabs}
          companies={data.companies}
          onAddCompany={(c: any) => actions.createItem('companies', c)}
          onUpdateCompany={(c: any) => actions.updateItem('companies', c)}
          onDeleteCompany={(id: string) => actions.deleteItem('companies', id)}
          documents={data.documents}
          onAddDocument={(d: any) => actions.createItem('documents', d)}
          onDeleteDocument={(id: string) => actions.deleteItem('documents', id)}
          team={data.team}
          onAddTeamMember={(m: any) => actions.createItem('team', m)}
          onUpdateTeamMember={(m: any) => actions.updateItem('team', m)}
          onDeleteTeamMember={(id: string) => actions.deleteItem('team', id)}
        />
      </TabsContent>}

      <TabsContent value="settings" className="mt-6">
        <SettingsCard visibleTabs={visibleTabs} onTabVisibilityChange={onTabVisibilityChange} />
      </TabsContent>
    </Tabs>
  );
}

    
