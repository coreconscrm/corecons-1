
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import Papa from 'papaparse';
import { Header } from "@/components/dashboard/header";
import { ProjectOverview, BudgetOverview, FormOverview } from "@/components/dashboard/welcome-banner";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const initialFormSubmissions: any[] = [];

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [reformas, setReformas] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [forms, setForms] = useState(initialFormSubmissions);
  const [contacts, setContacts] = useState<any[]>([]);
  const [priorityCalls, setPriorityCalls] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');


  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [visibleTabs, setVisibleTabs] = useState({
    projects: true,
    clients: true,
    reformas: true,
    providers: true,
    team: true,
    forms: true,
    budgets: true,
    companies: true,
    prices: true,
    collaborators: true,
  });
  const [activeTab, setActiveTab] = useState("clients");
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setForms([]); // Clear forms before fetching

    const loadFormsFromData = (data: any[], source: 'gsheet' | 'csv') => {
      const dataWithIdsAndStatus = data.map((item, index) => ({
        ...item,
        id: `form-${source}-${Date.now()}-${index}`,
        called: false,
        status: 'Pendiente',
      }));
      setForms(prevForms => [...prevForms, ...dataWithIdsAndStatus]);
      const sourceText = source === 'gsheet' ? 'Google Sheet' : 'CSV';
      toast({ title: `Datos de ${sourceText} cargados`, description: "Los datos del formulario se han procesado." });
    };

    try {
        console.log("Attempting to fetch data from Firestore...");
        const collections = ['clients', 'projects', 'providers', 'team', 'budgets', 'companies', 'contacts', 'reformas', 'documents', 'collaborators', 'priority_calls'];
        const snapshots = await Promise.all(collections.map(c => getDocs(collection(db, c))));
        
        const mapSnapToState = (snap: any) => snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));

        setClients(mapSnapToState(snapshots[0]));
        setProjects(mapSnapToState(snapshots[1]));
        setProviders(mapSnapToState(snapshots[2]));
        setTeam(mapSnapToState(snapshots[3]));
        setBudgets(mapSnapToState(snapshots[4]));
        setCompanies(mapSnapToState(snapshots[5]));
        setContacts(mapSnapToState(snapshots[6]));
        setReformas(mapSnapToState(snapshots[7]));
        setDocuments(mapSnapToState(snapshots[8]));
        setCollaborators(mapSnapToState(snapshots[9]));
        setPriorityCalls(mapSnapToState(snapshots[10]));

        // Fetch Google Sheet config and data
        const configDocRef = doc(db, 'config', 'googleSheet');
        const configDoc = await getDoc(configDocRef);
        if (configDoc.exists() && configDoc.data().url) {
            const url = configDoc.data().url;
            setSheetUrl(url);
            console.log("Fetching data from Google Sheet:", url);
            
            await new Promise<void>((resolve) => {
              Papa.parse(url, {
                  download: true,
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => {
                      if (results.errors.length) {
                        toast({ variant: 'destructive', title: "Error al leer Google Sheet", description: results.errors.map(e => e.message).join(', ') });
                        return resolve();
                      }
                      if (results.data.length > 0) {
                        loadFormsFromData(results.data as any[], 'gsheet');
                      }
                      resolve();
                  },
                  error: (error) => {
                    toast({ variant: 'destructive', title: "Error al conectar con Google Sheet", description: error.message });
                    resolve();
                  }
              });
            });
        }
        console.log("Data fetched successfully.");

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({
            variant: "destructive",
            title: "Error al cargar los datos",
            description: `Hubo un problema al conectar con Firestore. Revisa la consola. Error: ${(error as Error).message}`,
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleCreate = async (collectionName: string, item: any, type: string) => {
    try {
      let newItem = { ...item };
      
      if (type === 'Obra Nueva' || type === 'Reforma') {
        newItem = {
          ...newItem,
          memoria: item.memoria || "",
          planos: item.planos || "",
        };
      }

      if (collectionName === 'budgets') {
        newItem = {
            ...newItem,
            documents: newItem.documents || [],
        }
      }

      if (newItem.id) {
        const { id, ...data } = newItem;
        await setDoc(doc(db, collectionName, id), data);
      } else {
        await addDoc(collection(db, collectionName), newItem);
      }
      toast({ title: `${type} guardada`, description: `La ${type.toLowerCase()} se ha guardado correctamente.` });
      fetchData();
    } catch (error) {
        console.error(`Error adding ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al añadir ${type}`, description: `No se pudo guardar. Error: ${(error as Error).message}`});
    }
  };

  const handleUpdate = async (collectionName: string, item: any, type: string) => {
    const { id, ...data } = item;
    if (!id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha proporcionado un ID para actualizar.' });
        return;
    }
    try {
        await updateDoc(doc(db, collectionName, id), data);
        toast({ title: `${type} actualizada`, description: `Los cambios se han guardado.` });
        fetchData();
    } catch (error) {
        console.error(`Error updating ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al actualizar ${type}`, description: `No se pudo guardar. Error: ${(error as Error).message}`});
    }
  };
  
  const handleDelete = async (collectionName: string, id: string, type: string) => {
     if (!id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha proporcionado un ID para eliminar.' });
        return;
    }
    try {
        await deleteDoc(doc(db, collectionName, id));
        toast({ title: `${type} eliminada`, description: `La ${type.toLowerCase()} ha sido eliminada.`, variant: 'destructive' });
        fetchData();
    } catch (error) {
        console.error(`Error deleting ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al eliminar ${type}`, description: `No se pudo eliminar. Error: ${(error as Error).message}`});
    }
  };

  const handleLoadForms = (data: any[]) => {
    const dataWithIdsAndStatus = data.map((item, index) => ({
      ...item,
      id: `form-csv-${Date.now()}-${index}`,
      called: false,
      status: 'Pendiente',
    }));
    setForms(prevForms => [...prevForms, ...dataWithIdsAndStatus]);
    toast({ title: "Datos de CSV cargados", description: "El archivo ha sido procesado." });
  };
  
  const handleUpdateForm = (updatedForm: any) => {
    setForms((prev: any[]) => prev.map(form => form.id === updatedForm.id ? updatedForm : form));
  };
  
  const handleDeleteForm = (id: string) => {
    setForms((prevForms) => prevForms.filter((form) => form.id !== id));
    toast({ title: "Formulario eliminado", description: "La entrada del formulario ha sido eliminada de la vista actual.", variant: 'destructive' });
  };

  const handleSaveSheetUrl = async (url: string) => {
    try {
        const configDocRef = doc(db, 'config', 'googleSheet');
        await setDoc(configDocRef, { url });
        setSheetUrl(url);
        toast({ title: 'Configuración guardada', description: `La conexión con Google Sheets se ha ${url ? 'establecido' : 'eliminado'}.` });
        await fetchData();
    } catch (error) {
        console.error("Error saving Google Sheet URL: ", error);
        toast({ variant: 'destructive', title: 'Error al guardar', description: `No se pudo guardar la URL. Revisa la consola. Error: ${(error as Error).message}` });
    }
  };
  
  const projectsSigned = projects.filter(p => p.status === 'Firmados').length;
  const projectsInProgress = projects.filter(p => p.status === 'En proceso').length;
  const projectsCompleted = projects.filter(p => p.status === 'Finalizados').length;

  const budgetsPending = budgets.filter(b => b.status === 'Pendiente').length;
  const budgetsAccepted = budgets.filter(b => b.status === 'Aceptado').length;
  const budgetsRejected = budgets.filter(b => b.status === 'Rechazado').length;

  const formsTotal = forms.length + contacts.length + priorityCalls.length;
  const formsCalled = forms.filter(f => f.called).length + contacts.filter(c => c.called).length + priorityCalls.filter(pc => pc.called).length;
  const formsPending = formsTotal - formsCalled;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setActiveTab("settings")} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Conectando con tu base de datos...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ProjectOverview
                signed={projectsSigned}
                inProgress={projectsInProgress}
                completed={projectsCompleted}
              />
              <BudgetOverview
                pending={budgetsPending}
                accepted={budgetsAccepted}
                rejected={budgetsRejected}
              />
              <FormOverview
                total={formsTotal}
                called={formsCalled}
                pending={formsPending}
              />
            </div>
            
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}

              clients={clients}
              onAddClient={(client) => handleCreate('clients', client, 'Obra Nueva')}
              onUpdateClient={(client) => handleUpdate('clients', client, 'Obra Nueva')}
              onDeleteClient={(id) => handleDelete('clients', id, 'Obra Nueva')}
              
              reformas={reformas}
              onAddReforma={(reforma) => handleCreate('reformas', reforma, 'Reforma')}
              onUpdateReforma={(reforma) => handleUpdate('reformas', reforma, 'Reforma')}
              onDeleteReforma={(id) => handleDelete('reformas', id, 'Reforma')}

              projects={projects}
              onAddProject={(project) => handleCreate('projects', {...project, documentation: [], photos: [], ganttData: [], assignedProviders: []}, 'Proyecto')}
              onUpdateProject={(project) => handleUpdate('projects', project, 'Proyecto')}
              onDeleteProject={(id) => handleDelete('projects', id, 'Proyecto')}

              providers={providers}
              onAddProvider={(provider) => handleCreate('providers', provider, 'Proveedor')}
              onUpdateProvider={(provider) => handleUpdate('providers', provider, 'Proveedor')}
              onDeleteProvider={(id) => handleDelete('providers', id, 'Proveedor')}

              collaborators={collaborators}
              onAddCollaborator={(collaborator) => handleCreate('collaborators', collaborator, 'Colaborador')}
              onUpdateCollaborator={(collaborator) => handleUpdate('collaborators', collaborator, 'Colaborador')}
              onDeleteCollaborator={(id) => handleDelete('collaborators', id, 'Colaborador')}

              team={team}
              onAddTeamMember={(member) => handleCreate('team', member, 'Miembro')}
              onUpdateTeamMember={(member) => handleUpdate('team', member, 'Miembro')}
              onDeleteTeamMember={(id) => handleDelete('team', id, 'Miembro')}

              contacts={contacts}
              onAddContact={(contact) => {
                const newContact = {
                    ...contact,
                    called: contact.called ?? false,
                    status: contact.status ?? 'Pendiente',
                }
                handleCreate('contacts', newContact, 'Contacto');
              }}
              onUpdateContact={(contact) => handleUpdate('contacts', contact, 'Contacto')}
              onDeleteContact={(id) => handleDelete('contacts', id, 'Contacto')}

              forms={forms}
              onLoadForms={handleLoadForms}
              onUpdateForm={handleUpdateForm}
              onDeleteForm={handleDeleteForm}

              priorityCalls={priorityCalls}
              onAddPriorityCall={(call) => handleCreate('priority_calls', {...call, called: call.called ?? false, status: call.status ?? 'Pendiente'}, 'Llamada Prioritaria')}
              onUpdatePriorityCall={(call) => handleUpdate('priority_calls', call, 'Llamada Prioritaria')}
              onDeletePriorityCall={(id) => handleDelete('priority_calls', id, 'Llamada Prioritaria')}

              budgets={budgets}
              onAddBudget={(budget) => handleCreate('budgets', {...budget, m2: budget.m2 || 0 }, 'Presupuesto')}
              onUpdateBudget={(budget) => handleUpdate('budgets', budget, 'Presupuesto')}
              onDeleteBudget={(id) => handleDelete('budgets', id, 'Presupuesto')}

              companies={companies}
              onAddCompany={(company) => handleCreate('companies', company, 'Empresa')}
              onUpdateCompany={(company) => handleUpdate('companies', company, 'Empresa')}
              onDeleteCompany={(id) => handleDelete('companies', id, 'Empresa')}

              documents={documents}
              onAddDocument={(doc) => handleCreate('documents', doc, 'Documento')}
              onDeleteDocument={(id) => handleDelete('documents', id, 'Documento')}

              visibleTabs={visibleTabs}
              onTabVisibilityChange={setVisibleTabs}
              
              sheetUrl={sheetUrl}
              onSaveSheetUrl={handleSaveSheetUrl}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
