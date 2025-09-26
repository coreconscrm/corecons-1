
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useDashboard } from '@/context/dashboard-context';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, writeBatch } from "firebase/firestore";
import { ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject, getMetadata } from "firebase/storage";

// UI Components
import { Header } from "@/components/dashboard/header";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, StickyNote } from 'lucide-react';
import { NotepadSheet } from '@/components/dashboard/notepad-sheet';
import { PriceAssistantSheet } from '@/components/dashboard/price-assistant-sheet';
import { CalculatorSheet } from '@/components/dashboard/calculator-sheet';
import { Button } from "@/components/ui/button";

// Section Components
import { PanelControl } from '@/components/dashboard/panel-control';
import { OfficeSection } from '@/components/dashboard/oficina/office-section';
import { SeguimientoSection } from '@/components/dashboard/seguimiento/seguimiento-section';
import { AiSection, type AiBudgetItem } from '@/components/dashboard/ai/ai-section';
import { ProjectListCard, type Project } from '@/components/dashboard/projects/projects-section';
import { ClientsSection } from '@/components/dashboard/clients/clients-section';
import { BudgetSection, type Budget, type BudgetCategory } from '@/components/dashboard/budgets/budgets-section';
import { CompanySection } from '@/components/dashboard/company/company-section';
import { ProviderSection } from '@/components/dashboard/providers/providers-section';
import { FormsSection, type ColumnConfig } from '@/components/dashboard/forms/forms-section';
import { DiskSection } from '@/components/dashboard/company/disk-section';

const collectionStateMap: Record<string, string> = {
    projects: 'projects',
    clients: 'clients',
    reformas: 'reformas',
    providers: 'providers',
    collaborators: 'collaborators',
    interioristas: 'interioristas',
    constructoras: 'constructoras',
    reformistas: 'reformistas',
    inmobiliarias: 'inmobiliarias',
    team: 'team',
    forms: 'sheetForms',
    contacts: 'contacts',
    priority_calls: 'priorityCalls',
    seguimientos: 'seguimientos',
    seguimientoEstadoOptions: 'seguimientoEstadoOptions',
    seguimientoPorHacerOptions: 'seguimientoPorHacerOptions',
    seguimientoCategories: 'seguimientoCategories',
    clientCategories: 'clientCategories',
    budgets: 'budgets',
    companies: 'companies',
    documents: 'documents',
    juanfran_notes: 'juanfranNotes',
    sandra_notes: 'sandraNotes',
    jordan_checklists: 'jordanChecklists',
    dani_priorities: 'daniPriorities',
    chat_messages: 'chatMessages',
    julian_notes: 'julianNotes',
    ia_budgets: 'aiBudgets',
    a_presentar: 'aPresentar',
    company_links: 'companyLinks',
    link_sections: 'linkSections',
    estimaciones: 'estimaciones',
    protocols: 'protocols',
};

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { activeTab, setActiveTab } = useDashboard();
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>({
    projects: [], clients: [], reformas: [], providers: [], collaborators: [],
    interioristas: [], constructoras: [], reformistas: [], inmobiliarias: [],
    team: [], sheetForms: [], contacts: [], priorityCalls: [],
    seguimientos: [], seguimientoEstadoOptions: [], seguimientoPorHacerOptions: [], seguimientoCategories: [],
    clientCategories: [], budgets: [], companies: [], documents: [],
    juanfranNotes: [], sandraNotes: [], jordanChecklists: [], daniPriorities: [],
    chatMessages: [], julianNotes: [], aiBudgets: [], aPresentar: [],
    companyLinks: [], linkSections: [], estimaciones: [], protocols: [],
    formCols: [], contactCols: [], priorityCols: [], sheetUrl: '', diskItems: [],
  });

  const [isNotepadOpen, setNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const [isPriceAssistantOpen, setPriceAssistantOpen] = useState(false);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const fetchDiskItems = useCallback(async (path: string = 'disco/') => {
    // Implementation can be added here if needed
    return [];
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    setActiveTab('panel');

    const unsubscribers = Object.entries(collectionStateMap).map(([collectionName, stateKey]) => 
        onSnapshot(query(collection(db, collectionName)), 
            (snapshot) => {
                 const docsData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                 setData(prev => ({ ...prev, [stateKey]: docsData }));
            },
            (error) => toast({ variant: 'destructive', title: `Error de Conexión (${collectionName})`, description: "No se pudieron cargar los datos en tiempo real." })
        )
    );
    
    const fetchConfigs = async () => {
        const settingsSnap = await getDoc(doc(db, 'config', 'dashboardSettings'));
        if (settingsSnap.exists()) {
            const settings = settingsSnap.data();
            setData(prev => ({ ...prev, ...settings }));
        }
    }

    Promise.all([fetchConfigs(), fetchDiskItems('disco/').then(items => setData(prev => ({...prev, diskItems: items})))]).finally(() => setIsLoading(false));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user, toast, fetchDiskItems, setActiveTab]);

  const createItem = useCallback(async (collectionName: string, itemData: any, idField?: string) => {
    try {
        if (idField && itemData[idField]) {
            await setDoc(doc(db, collectionName, itemData[idField]), itemData);
        } else {
            await addDoc(collection(db, collectionName), itemData);
        }
        toast({ title: 'Éxito', description: 'El elemento ha sido creado correctamente.' });
    } catch (error) {
        console.error("Error creating item: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el elemento.' });
    }
  }, [toast]);

  const updateItem = useCallback(async (collectionName: string, itemData: any) => {
    if (!itemData.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'El ID del elemento es inválido.' });
        return;
    }
    try {
        const docRef = doc(db, collectionName, itemData.id);
        const { id, ...dataToUpdate } = itemData;
        await updateDoc(docRef, dataToUpdate);
        toast({ title: 'Éxito', description: 'El elemento ha sido actualizado.' });
    } catch (error) {
        console.error("Error updating item: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el elemento.' });
    }
  }, [toast]);

  const deleteItem = useCallback(async (collectionName: string, id: string) => {
    try {
        await deleteDoc(doc(db, collectionName, id));
        toast({ title: 'Éxito', description: 'El elemento ha sido eliminado.' });
    } catch (error) {
        console.error("Error deleting item: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el elemento.' });
    }
  }, [toast]);

  const updateConfig = useCallback(async (key: string, value: any) => {
      try {
          await setDoc(doc(db, 'config', 'dashboardSettings'), { [key]: value }, { merge: true });
          toast({ title: 'Configuración guardada', description: 'La vista ha sido actualizada.' });
      } catch (error) {
          console.error('Error updating config:', error);
          toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive'});
      }
  }, [toast]);


  const renderActiveTab = () => {
    if (isLoading) return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    switch (activeTab) {
        case 'panel':
            return <PanelControl 
                juanfranNotes={data.juanfranNotes}
                julianNotes={data.julianNotes}
                sandraNotes={data.sandraNotes}
                jordanChecklists={data.jordanChecklists}
                daniPriorities={data.daniPriorities}
                chatMessages={data.chatMessages}
                seguimientos={data.seguimientos}
                budgets={data.budgets}
                forms={data.sheetForms}
                contacts={data.contacts}
            />;
        case 'oficina': 
            return <OfficeSection 
                juanfranNotes={data.juanfranNotes} onAddJuanfranNote={(n) => createItem('juanfran_notes', n)} onUpdateJuanfranNote={(n) => updateItem('juanfran_notes', n)} onDeleteJuanfranNote={(id) => deleteItem('juanfran_notes', id)}
                sandraNotes={data.sandraNotes} onAddSandraNote={(n) => createItem('sandra_notes', n)} onUpdateSandraNote={(n) => updateItem('sandra_notes', n)} onDeleteSandraNote={(id) => deleteItem('sandra_notes', id)}
                jordanChecklists={data.jordanChecklists} onAddJordanChecklist={(c) => createItem('jordan_checklists', c)} onUpdateJordanChecklist={(c) => updateItem('jordan_checklists', c)} onDeleteJordanChecklist={(id) => deleteItem('jordan_checklists', id)}
                daniPriorities={data.daniPriorities} onAddDaniPriority={(p) => createItem('dani_priorities', p)} onUpdateDaniPriority={(p) => updateItem('dani_priorities', p)} onDeleteDaniPriority={(id) => deleteItem('dani_priorities', id)}
                aPresentar={data.aPresentar} onAddPresentar={(p) => createItem('a_presentar', p)} onUpdatePresentar={(p) => updateItem('a_presentar', p)} onDeletePresentar={(id) => deleteItem('a_presentar', id)}
                chatMessages={data.chatMessages} team={data.team} onAddChatMessage={(m) => createItem('chat_messages', m)} onUpdateChatMessage={(m) => updateItem('chat_messages', m)} onDeleteChatMessage={(id) => deleteItem('chat_messages', id)}
                julianNotes={data.julianNotes} onAddJulianNote={(n) => createItem('julian_notes', n)} onUpdateJulianNote={(n) => updateItem('julian_notes', n)} onDeleteJulianNote={(id) => deleteItem('julian_notes', id)}
            />;
        case 'seguimiento': return <SeguimientoSection 
            seguimientos={data.seguimientos}
            onAddSeguimiento={(s) => createItem('seguimientos', s)}
            onUpdateSeguimiento={(s) => updateItem('seguimientos', s)}
            onDeleteSeguimiento={(id) => deleteItem('seguimientos', id)}
            estadoOptions={data.seguimientoEstadoOptions.map((o:any) => o.name)}
            porHacerOptions={data.seguimientoPorHacerOptions.map((o:any) => o.name)}
            categories={data.seguimientoCategories.map((c:any) => c.name)}
            onSeguimientoOptionsChange={(type, opts) => updateConfig(`seguimiento${type.charAt(0).toUpperCase() + type.slice(1)}Options`, opts.map(o => ({name: o})))} />;
        case 'ia': return <AiSection 
             companies={data.companies} forms={data.sheetForms} aiBudgets={data.aiBudgets}
            onAddAiBudget={(b) => createItem('ia_budgets', b)} onUpdateAiBudget={(b) => updateItem('ia_budgets', b)} onDeleteAiBudget={(id) => deleteItem('ia_budgets', id)}
             />;
        case 'projects': return <ProjectListCard 
            projects={data.projects} clients={data.clients} providers={data.providers} 
            onAddProject={(p) => createItem('projects', p)} onUpdateProject={(p) => updateItem('projects', p)} onDeleteProject={(id) => deleteItem('projects', id)} />;
        case 'clients':
        case 'reformas': 
            return <ClientsSection
                clients={data.clients} providers={data.providers} reformas={data.reformas}
                onAddClient={(c) => createItem('clients', c)} onUpdateClient={(c) => updateItem('clients', c)} onDeleteClient={(id) => deleteItem('clients', id)}
                onAddReforma={(r) => createItem('reformas', r)} onUpdateReforma={(r) => updateItem('reformas', r)} onDeleteReforma={(id) => deleteItem('reformas', id)}
                visibleTabs={{clients: true, reformas: true}} clientCategories={data.clientCategories.map((c:any) => c.name)} onClientCategoriesChange={(cats) => updateConfig('clientCategories', cats.map(c => ({name: c})))} />;
        case 'budgets': return <BudgetSection 
            budgets={data.budgets} clients={data.clients} companies={data.companies}
            onAddBudget={(b) => createItem('budgets', b)} onUpdateBudget={(b) => updateItem('budgets', b)} onDeleteBudget={(id) => deleteItem('budgets', id)} />;
        case 'companies':
        case 'estimaciones':
        case 'protocols':
             return <CompanySection
                companies={data.companies} onAddCompany={(c) => createItem('companies', c)} onUpdateCompany={(c) => updateItem('companies', c)} onDeleteCompany={(id) => deleteItem('companies', id)}
                documents={data.documents} onAddDocument={(d) => createItem('documents', d)} onDeleteDocument={(id) => deleteItem('documents', id)}
                team={data.team} onAddTeamMember={(m) => createItem('team', m)} onUpdateTeamMember={(m) => updateItem('team', m)} onDeleteTeamMember={(id) => deleteItem('team', id)}
                diskItems={data.diskItems} onUploadFile={() => {}} onCreateFolder={() => {}} onDeleteItem={() => {}} fetchDiskItems={fetchDiskItems}
                visibleTabs={{ companies: true, team: true, documents: true, disk: true, links: true, estimaciones: true, protocols: true }}
                links={data.company_links} linkSections={data.link_sections} onAddItem={createItem} onUpdateItem={updateItem} onDeleteLinkItem={deleteItem}
                estimaciones={data.estimaciones} protocols={data.protocols} />;
        case 'providers':
        case 'collaborators':
        case 'interioristas':
        case 'constructoras':
        case 'reformistas':
        case 'inmobiliarias': 
            return <ProviderSection
                providers={data.providers} onAddProvider={(p) => createItem('providers', p)} onUpdateProvider={(p) => updateItem('providers', p)} onDeleteProvider={(id) => deleteItem('providers', id)}
                collaborators={data.collaborators} onAddCollaborator={(c) => createItem('collaborators', c)} onUpdateCollaborator={(c) => updateItem('collaborators', c)} onDeleteCollaborator={(id) => deleteItem('collaborators', id)}
                interioristas={data.interioristas} onAddInteriorista={(i) => createItem('interioristas', i)} onUpdateInteriorista={(i) => updateItem('interioristas', i)} onDeleteInteriorista={(id) => deleteItem('interioristas', id)}
                constructoras={data.constructoras} onAddConstructora={(c) => createItem('constructoras', c)} onUpdateConstructora={(c) => updateItem('constructoras', c)} onDeleteConstructora={(id) => deleteItem('constructoras', id)}
                reformistas={data.reformistas} onAddReformista={(r) => createItem('reformistas', r)} onUpdateReformista={(r) => updateItem('reformistas', r)} onDeleteReformista={(id) => deleteItem('reformistas', id)}
                inmobiliarias={data.inmobiliarias} onAddInmobiliaria={(i) => createItem('inmobiliarias', i)} onUpdateInmobiliaria={(i) => updateItem('inmobiliarias', i)} onDeleteInmobiliaria={(id) => deleteItem('inmobiliarias', id)}
                visibleTabs={{ providers: true, collaborators: true, interioristas: true, constructoras: true, reformistas: true, inmobiliarias: true, prices: true }} />;
        case 'forms': return <FormsSection
            forms={data.sheetForms} contacts={data.contacts} priorityCalls={data.priorityCalls}
            onAddContact={(c) => createItem('contacts', c)} onUpdateContact={(c) => updateItem('contacts', c)} onDeleteContact={(id) => deleteItem('contacts', id)}
            onAddPriorityCall={(c) => createItem('priority_calls', c)} onUpdatePriorityCall={(c) => updateItem('priority_calls', c)} onDeletePriorityCall={(id) => deleteItem('priority_calls', id)}
            sheetUrl={data.sheetUrl} onSaveSheetUrl={(url) => updateConfig('sheetUrl', url)}
            formCols={data.formCols} onFormColsChange={(cols) => updateConfig('formCols', cols)} 
            contactCols={data.contactCols} onContactColsChange={(cols) => updateConfig('contactCols', cols)}
            priorityCols={data.priorityCols} onPriorityColsChange={(cols) => updateConfig('priorityCols', cols)}
            onCreateSeguimientoFromContact={() => {}} onMoveFormContact={() => {}} onUpdateSheetFormStatus={updateItem} />;
        case 'disk': return <DiskSection initialItems={data.diskItems} onUploadFile={() => {}} onCreateFolder={() => {}} onDeleteItem={() => {}} fetchItems={fetchDiskItems} />;
        default:
             return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
  };

  if (authLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onPriceAssistantClick={() => setPriceAssistantOpen(true)} onCalculatorClick={() => setCalculatorOpen(true)} />
      <NotepadSheet open={isNotepadOpen} onOpenChange={setNotepadOpen} content={notepadContent} onContentChange={setNotepadContent} />
      <PriceAssistantSheet open={isPriceAssistantOpen} onOpenChange={setPriceAssistantOpen} />
      <CalculatorSheet open={isCalculatorOpen} onOpenChange={setCalculatorOpen} />
      
      <Button variant="default" size="icon" className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50" onClick={() => setNotepadOpen(true)} aria-label="Abrir bloc de notas">
        <StickyNote className="h-5 w-5" />
      </Button>

      <main className="flex-1 p-2 sm:p-4 lg:p-6">
        {renderActiveTab()}
      </main>
      <Toaster />
    </div>
  );
}
