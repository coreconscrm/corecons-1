"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Header } from "@/components/dashboard/header";
import { ProjectOverview, BudgetOverview, FormOverview } from "@/components/dashboard/welcome-banner";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const initialFormSubmissions: any[] = [];

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [forms, setForms] = useState(initialFormSubmissions);
  const [contacts, setContacts] = useState<any[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [visibleTabs, setVisibleTabs] = useState({
    projects: true,
    clients: true,
    providers: true,
    team: true,
    forms: true,
    budgets: true,
    companies: true,
  });
  const [activeTab, setActiveTab] = useState("projects");
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        console.log("Attempting to fetch data from Firestore...");
        const collections = ['clients', 'projects', 'providers', 'team', 'budgets', 'companies', 'contacts'];
        const snapshots = await Promise.all(collections.map(c => getDocs(collection(db, c))));
        
        const mapSnapToState = (snap: any) => snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));

        setClients(mapSnapToState(snapshots[0]));
        setProjects(mapSnapToState(snapshots[1]));
        setProviders(mapSnapToState(snapshots[2]));
        setTeam(mapSnapToState(snapshots[3]));
        setBudgets(mapSnapToState(snapshots[4]));
        setCompanies(mapSnapToState(snapshots[5]));
        setContacts(mapSnapToState(snapshots[6]));
        console.log("Data fetched successfully.");

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({
            variant: "destructive",
            title: "Error al cargar los datos",
            description: `Hubo un problema al conectar con Firestore. Revisa la consola del navegador para más detalles. Error: ${(error as Error).message}`,
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
      if (item.id) {
        const { id, ...data } = item;
        await setDoc(doc(db, collectionName, id), data);
      } else {
        await addDoc(collection(db, collectionName), item);
      }
      toast({ title: `${type} guardado`, description: `El ${type.toLowerCase()} se ha guardado correctamente en tu base de datos.` });
      fetchData();
    } catch (error) {
        console.error(`Error adding ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al añadir ${type}`, description: `No se pudo guardar el elemento. Revisa la consola para más detalles. Error: ${(error as Error).message}`});
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
        toast({ title: `${type} actualizado`, description: `Los cambios en el ${type.toLowerCase()} se han guardado en tu base de datos.` });
        fetchData();
    } catch (error) {
        console.error(`Error updating ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al actualizar ${type}`, description: `No se pudo guardar los cambios. Revisa la consola para más detalles. Error: ${(error as Error).message}`});
    }
  };
  
  const handleDelete = async (collectionName: string, id: string, type: string) => {
     if (!id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha proporcionionado un ID para eliminar.' });
        return;
    }
    try {
        await deleteDoc(doc(db, collectionName, id));
        toast({ title: `${type} eliminado`, description: `El ${type.toLowerCase()} ha sido eliminado de tu base de datos.`, variant: 'destructive' });
        fetchData();
    } catch (error) {
        console.error(`Error deleting ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al eliminar ${type}`, description: `No se pudo eliminar el elemento. Revisa la consola para más detalles. Error: ${(error as Error).message}`});
    }
  };

  const handleLoadForms = (data: any[]) => {
    const dataWithIdsAndStatus = data.map((item, index) => ({
      ...item,
      id: `form-${Date.now()}-${index}`,
      called: false,
      status: 'Pendiente',
    }));
    setForms(dataWithIdsAndStatus);
    toast({ title: "Datos cargados", description: "El archivo CSV ha sido procesado correctamente." });
  };
  
  const handleUpdateForm = (updatedForm: any) => {
    setForms((prev: any[]) => prev.map(form => form.id === updatedForm.id ? updatedForm : form));
  };
  
  const projectsSigned = projects.filter(p => p.status === 'Firmados').length;
  const projectsInProgress = projects.filter(p => p.status === 'En proceso').length;
  const projectsCompleted = projects.filter(p => p.status === 'Finalizados').length;

  const budgetsPending = budgets.filter(b => b.status === 'Pendiente').length;
  const budgetsAccepted = budgets.filter(b => b.status === 'Aceptado').length;
  const budgetsRejected = budgets.filter(b => b.status === 'Rechazado').length;

  const formsTotal = forms.length + contacts.length;
  const formsCalled = forms.filter(f => f.called).length + contacts.filter(c => c.called).length;
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
              onAddClient={(client) => handleCreate('clients', client, 'Cliente')}
              onUpdateClient={(client) => handleUpdate('clients', client, 'Cliente')}
              onDeleteClient={(id) => handleDelete('clients', id, 'Cliente')}

              projects={projects}
              onAddProject={(project) => handleCreate('projects', {...project, documentation: [], photos: [], ganttData: [], assignedProviders: []}, 'Proyecto')}
              onUpdateProject={(project) => handleUpdate('projects', project, 'Proyecto')}
              onDeleteProject={(id) => handleDelete('projects', id, 'Proyecto')}

              providers={providers}
              onAddProvider={(provider) => handleCreate('providers', provider, 'Proveedor')}
              onUpdateProvider={(provider) => handleUpdate('providers', provider, 'Proveedor')}
              onDeleteProvider={(id) => handleDelete('providers', id, 'Proveedor')}

              team={team}
              onAddTeamMember={(member) => handleCreate('team', member, 'Miembro')}
              onUpdateTeamMember={(member) => handleUpdate('team', member, 'Miembro')}
              onDeleteTeamMember={(id) => handleDelete('team', id, 'Miembro')}

              contacts={contacts}
              onAddContact={(contact) => handleCreate('contacts', contact, 'Contacto')}
              onUpdateContact={(contact) => handleUpdate('contacts', contact, 'Contacto')}
              onDeleteContact={(id) => handleDelete('contacts', id, 'Contacto')}

              forms={forms}
              onLoadForms={handleLoadForms}
              onUpdateForm={handleUpdateForm}
              onDeleteForm={(id) => handleDelete('forms', id, 'Formulario')}

              budgets={budgets}
              onAddBudget={(budget) => handleCreate('budgets', {...budget, documents: []}, 'Presupuesto')}
              onUpdateBudget={(budget) => handleUpdate('budgets', budget, 'Presupuesto')}
              onDeleteBudget={(id) => handleDelete('budgets', id, 'Presupuesto')}

              companies={companies}
              onAddCompany={(company) => handleCreate('companies', company, 'Empresa')}
              onUpdateCompany={(company) => handleUpdate('companies', company, 'Empresa')}
              onDeleteCompany={(id) => handleDelete('companies', id, 'Empresa')}

              visibleTabs={visibleTabs}
              onTabVisibilityChange={setVisibleTabs}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
