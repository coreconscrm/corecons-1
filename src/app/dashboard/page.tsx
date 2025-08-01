
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc, query, orderBy } from "firebase/firestore";
import Papa from 'papaparse';
import { Header } from "@/components/dashboard/header";
import { SeguimientoOverview, BudgetOverview, FormOverview, OficinaOverview } from "@/components/dashboard/welcome-banner";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, StickyNote } from 'lucide-react';
import { NotepadSheet } from '@/components/dashboard/notepad-sheet';
import { isWithinInterval, addDays, isValid, parse, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import type { BudgetCategory, LineItem } from '@/components/dashboard/budgets-card';
import type { AiBudgetItem } from '@/components/dashboard/ai-section';


const initialFormSubmissions: any[] = [];
const defaultEstadoOptions = ["primer contacto", "llamado", "falta arquitecto", "buscar terreno"];
const defaultPorHacerOptions = ["llamar", "buscar arquitecto", "licencia"];
const defaultSeguimientoCategories = ["General"];
const defaultVisibleTabs = {
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
    interioristas: true,
    constructoras: true,
    reformistas: true,
    inmobiliarias: true,
    seguimiento: true,
    ia: true,
    oficina: true,
};

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [reformas, setReformas] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [interioristas, setInterioristas] = useState<any[]>([]);
  const [constructoras, setConstructoras] = useState<any[]>([]);
  const [reformistas, setReformistas] = useState<any[]>([]);
  const [inmobiliarias, setInmobiliarias] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [forms, setForms] = useState(initialFormSubmissions);
  const [contacts, setContacts] = useState<any[]>([]);
  const [priorityCalls, setPriorityCalls] = useState<any[]>([]);
  const [seguimientos, setSeguimientos] = useState<any[]>([]);
  const [juanfranNotes, setJuanfranNotes] = useState<any[]>([]);
  const [julianNotes, setJulianNotes] = useState<any[]>([]);
  const [sandraNotes, setSandraNotes] = useState<any[]>([]);
  const [jordanChecklists, setJordanChecklists] = useState<any[]>([]);
  const [daniPriorities, setDaniPriorities] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');

  const [estadoOptions, setEstadoOptions] = useState<string[]>(defaultEstadoOptions);
  const [porHacerOptions, setPorHacerOptions] = useState<string[]>(defaultPorHacerOptions);
  const [seguimientoCategories, setSeguimientoCategories] = useState<string[]>(defaultSeguimientoCategories);


  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [visibleTabs, setVisibleTabs] = useState(defaultVisibleTabs);
  const [activeTab, setActiveTab] = useState("oficina");

  const [isNotepadOpen, setNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const [showOverviewPanels, setShowOverviewPanels] = useState(false);

  useEffect(() => {
    const savedTab = localStorage.getItem('mainTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('mainTab', tab);
  };
  
  const handleSeguimientoOptionsChange = async (type: 'estado' | 'porHacer' | 'categories', newOptions: string[]) => {
    try {
        const optionsDocRef = doc(db, 'config', 'seguimientoOptions');
        if (type === 'estado') {
            setEstadoOptions(newOptions);
            await setDoc(optionsDocRef, { estadoOptions: newOptions }, { merge: true });
        } else if (type === 'porHacer') {
            setPorHacerOptions(newOptions);
            await setDoc(optionsDocRef, { porHacerOptions: newOptions }, { merge: true });
        } else if (type === 'categories') {
            setSeguimientoCategories(newOptions);
            await setDoc(optionsDocRef, { categories: newOptions }, { merge: true });
        }
        toast({ title: 'Opciones guardadas', description: 'Tus cambios en las opciones de seguimiento han sido guardados en la base de datos.' });
    } catch (error) {
        console.error("Error saving seguimiento options to Firestore", error);
        toast({ variant: 'destructive', title: `Error al guardar`, description: `No se pudieron guardar las opciones. Error: ${(error as Error).message}`});
    }
  };

  const handleTabVisibilityChange = async (newVisibleTabs: any) => {
    setVisibleTabs(newVisibleTabs);
    try {
        const settingsDocRef = doc(db, 'config', 'dashboardSettings');
        await setDoc(settingsDocRef, { visibleTabs: newVisibleTabs }, { merge: true });
        toast({ title: 'Visibilidad guardada', description: 'Tus preferencias de visibilidad se han guardado.' });
    } catch (error) {
        console.error("Error saving tab visibility to Firestore", error);
        toast({ variant: 'destructive', title: `Error al guardar`, description: `No se pudieron guardar los cambios. Error: ${(error as Error).message}`});
    }
  };


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
        const collections = ['clients', 'projects', 'providers', 'team', 'budgets', 'companies', 'contacts', 'reformas', 'documents', 'collaborators', 'priority_calls', 'interioristas', 'constructoras', 'reformistas', 'inmobiliarias', 'seguimientos', 'juanfran_notes', 'sandra_notes', 'jordan_checklists', 'dani_priorities', 'julian_notes'];
        const snapshots = await Promise.all(collections.map(c => getDocs(collection(db, c))));
        const chatQuery = query(collection(db, 'chat_messages'), orderBy('createdAt', 'desc'));
        const chatSnapshot = await getDocs(chatQuery);
        
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
        setInterioristas(mapSnapToState(snapshots[11]));
        setConstructoras(mapSnapToState(snapshots[12]));
        setReformistas(mapSnapToState(snapshots[13]));
        setInmobiliarias(mapSnapToState(snapshots[14]));
        setSeguimientos(mapSnapToState(snapshots[15]));
        setJuanfranNotes(mapSnapToState(snapshots[16]));
        setSandraNotes(mapSnapToState(snapshots[17]));
        setJordanChecklists(mapSnapToState(snapshots[18]));
        setDaniPriorities(mapSnapToState(snapshots[19]));
        setJulianNotes(mapSnapToState(snapshots[20]));
        setChatMessages(mapSnapToState(chatSnapshot));

        // Fetch config options
        const seguimientoOptionsRef = doc(db, 'config', 'seguimientoOptions');
        const seguimientoOptionsSnap = await getDoc(seguimientoOptionsRef);
        if (seguimientoOptionsSnap.exists()) {
            const optionsData = seguimientoOptionsSnap.data();
            if(optionsData.estadoOptions) setEstadoOptions(optionsData.estadoOptions);
            if(optionsData.porHacerOptions) setPorHacerOptions(optionsData.porHacerOptions);
            if(optionsData.categories) setSeguimientoCategories(optionsData.categories);
        }

        // Fetch dashboard settings (tab visibility, etc.)
        const settingsDocRef = doc(db, 'config', 'dashboardSettings');
        const settingsDocSnap = await getDoc(settingsDocRef);
        if (settingsDocSnap.exists()) {
            const settingsData = settingsDocSnap.data();
            if (settingsData.visibleTabs) {
                setVisibleTabs(prev => ({ ...prev, ...settingsData.visibleTabs }));
            }
        }

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
          priority: item.priority === undefined ? null : item.priority,
        };
      }

      if (collectionName === 'budgets') {
        newItem = {
            ...newItem,
            category: item.category || 'enviados',
            documents: item.documents || [],
        }
      }
      
      if (collectionName === 'seguimientos') {
        newItem = {
            ...newItem,
            category: item.category || "General",
        }
      }

      if (collectionName === 'dani_priorities') {
          newItem = {
              ...newItem,
              completed: false,
              documentUrl: item.documentUrl || "",
              documentName: item.documentName || "",
          }
      }

       if (collectionName === 'jordan_checklists' || collectionName === 'juanfran_notes' || collectionName === 'sandra_notes' || collectionName === 'julian_notes') {
            newItem = {
                ...newItem,
                completed: item.completed ?? false,
                date: new Date(),
            }
        }
      
      if (collectionName === 'chat_messages') {
          newItem = {
              ...newItem,
              read: item.read || false,
          }
      }
      
      if (collectionName === 'sandra_notes') {
         newItem = {
            ...newItem,
            category: item.category || "General",
            completed: item.completed || false,
            date: new Date(),
         }
      }

      if (newItem.id) {
        const { id, ...data } = newItem;
        await setDoc(doc(db, collectionName, id), data);
      } else {
        await addDoc(collection(db, collectionName), newItem);
      }
      toast({ title: `${type} guardada`, description: `La ${type.toLowerCase()} se ha guardado correctamente.` });
      await fetchData();
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
        if (type === 'Obra Nueva' || type === 'Reforma') {
            if (data.priority === undefined) {
                data.priority = null;
            }
        }
         if (collectionName === 'jordan_checklists' && !item.type) {
            data.type = 'checklist';
        }
        await updateDoc(doc(db, collectionName, id), data);
        toast({ title: `${type} actualizada`, description: `Los cambios se han guardado.` });
        await fetchData();
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
        await fetchData();
    } catch (error) {
        console.error(`Error deleting ${type}: `, error);
        toast({ variant: 'destructive', title: `Error al eliminar ${type}`, description: `No se pudo eliminar. Error: ${(error as Error).message}`});
    }
  };
  
  const handleCreateBudgetFromClient = (client: any, category: BudgetCategory = 'enviados') => {
    const budgetDocs = [];
    if (client.memoria) {
      budgetDocs.push({ name: 'Memoria', url: client.memoria });
    }
    if (client.planos) {
      budgetDocs.push({ name: 'Planos', url: client.planos });
    }

    const newBudget = {
      name: `Presupuesto para ${client.name}`,
      clientId: client.id,
      documents: budgetDocs,
      status: 'Pendiente',
      total: 0,
      lineItems: [],
      category: category,
    };

    handleCreate('budgets', newBudget, 'Presupuesto');
    toast({
      title: 'Presupuesto Creado',
      description: `Se ha creado un nuevo presupuesto para ${client.name}. Ve a la pestaña de Presupuestos para editarlo.`,
    });
  };

  const handleCreateSeguimientoFromClient = (client: any) => {
    const newSeguimiento = {
        name: client.name || 'Sin nombre',
        phone: client.phone || '',
        email: client.email || '',
        localizacion: client.localizacion || '',
        informacion: `Cliente existente - ${client.name}`,
        estado: 'primer contacto',
        porHacer: 'llamar',
        siguienteLlamada: null,
        category: 'General',
    };
    handleCreate('seguimientos', newSeguimiento, 'Seguimiento');
    toast({
      title: 'Movido a Seguimiento',
      description: `${client.name} ha sido añadido a la lista de seguimiento.`,
    });
  };

  const handleCreateBudgetFromAi = (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas') => {
    const lineItems: LineItem[] = [];

    let grandTotal = 0;

    aiBudget.breakdown.capitulos.forEach(capitulo => {
        // Add chapter title as a line item
        lineItems.push({
            description: capitulo.nombre,
            isChapter: true,
            quantity: 0,
            unit: '',
            unitPrice: 0,
        });

        capitulo.partidas.forEach(partida => {
            const lineTotal = aiBudget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
            grandTotal += lineTotal;
            lineItems.push({
                description: partida.descripcion,
                quantity: parseFloat(String(partida.medicion).replace(',', '.')) || 1,
                unit: partida.unidad?.toLowerCase() || '',
                unitPrice: lineTotal, // This is the total for the line
                isChapter: false,
            });
        });
    });

    const newBudget = {
        name: aiBudget.title,
        clientId: null,
        status: 'Pendiente',
        total: grandTotal,
        lineItems: lineItems,
        category: category,
        documents: [],
    };
    
    handleCreate('budgets', newBudget, 'Presupuesto');
    toast({
      title: 'Presupuesto Añadido',
      description: `Se ha creado un nuevo presupuesto en "${category === 'obra_nueva' ? 'Obra Nueva' : 'Reformas'}".`,
    });
  };

  const handleCreateSummaryBudgetFromAi = (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas') => {
    const lineItems: LineItem[] = [];
    let grandTotal = 0;
    
    aiBudget.breakdown.capitulos.forEach(capitulo => {
        const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
            return sum + (aiBudget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0);
        }, 0);
        
        lineItems.push({
            description: capitulo.nombre,
            isChapter: false, // Treat as a regular line item
            quantity: 1,
            unit: 'total',
            unitPrice: chapterTotal,
        });
        grandTotal += chapterTotal;
    });

    const newBudget = {
        name: `Resumen de ${aiBudget.title}`,
        clientId: null,
        status: 'Pendiente',
        total: grandTotal,
        lineItems: lineItems,
        category: category,
        documents: [],
    };
    
    handleCreate('budgets', newBudget, 'Presupuesto');
    toast({
      title: 'Presupuesto Resumido Añadido',
      description: `Se ha creado un presupuesto resumido en "${category === 'obra_nueva' ? 'Obra Nueva' : 'Reformas'}".`,
    });
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
  
  // Metrics for Budget Overview
  const budgetsPending = budgets.filter(b => b.status === 'Pendiente').length;
  const budgetsAccepted = budgets.filter(b => b.status === 'Aceptado').length;
  const budgetsRejected = budgets.filter(b => b.status === 'Rechazado').length;
  const budgetsDone = budgets.filter(b => b.status === 'Hechos').length;
  const budgetsSent = budgets.filter(b => b.status === 'Enviados').length;

  // Metrics for Form Overview
  const formsTotal = forms.length;
  const manualAndPriorityTotal = contacts.length + priorityCalls.length;
  const manualAndPriorityCalled = contacts.filter(c => c.called).length + priorityCalls.filter(pc => pc.called).length;
  const manualAndPriorityPending = manualAndPriorityTotal - manualAndPriorityCalled;

  // Metrics for Seguimiento Overview
  const totalSeguimientos = seguimientos.length;
  
  const llamarEstaSemana = seguimientos.filter(s => {
    if (!s.siguienteLlamada || typeof s.siguienteLlamada !== 'string') return false;
    
    const nextCallDate = parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date());

    if (!isValid(nextCallDate)) return false;

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { locale: es, weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { locale: es, weekStartsOn: 1 });
    
    return isWithinInterval(nextCallDate, { start: startOfThisWeek, end: endOfThisWeek });
  }).length;
  
  const ofrecerArquitecto = seguimientos.filter(s => s.porHacer?.toLowerCase().trim() === 'buscar arquitecto').length;
  const buscarTerreno = seguimientos.filter(s => s.estado?.toLowerCase().trim() === 'buscar terreno').length;

  // Metrics for Oficina Overview
  const countPending = (items: any[]) => {
    return items.filter(item => {
        if (item.type === 'checklist') {
            // A checklist is pending if not all its sub-items are completed
            return !(item.items || []).every((subItem: any) => subItem.completed);
        }
        // A note is pending if its top-level 'completed' is false
        return !item.completed;
    }).length;
  };
  
  const juanfranPending = countPending(juanfranNotes);
  const julianPending = countPending(julianNotes);
  const sandraPending = sandraNotes.filter(n => !n.completed).length;
  const jordanPending = countPending(jordanChecklists);
  const daniPending = daniPriorities.filter(p => !p.completed).length;
  const unreadChats = chatMessages.filter(m => !m.read).length;


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <NotepadSheet open={isNotepadOpen} onOpenChange={setNotepadOpen} content={notepadContent} onContentChange={setNotepadContent} />
      
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => setNotepadOpen(true)}
        aria-label="Abrir bloc de notas"
      >
        <StickyNote className="h-6 w-6" />
      </Button>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Conectando con tu base de datos...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">Panel de Control</h1>
                <Button variant="ghost" size="icon" onClick={() => setShowOverviewPanels(!showOverviewPanels)} className="text-muted-foreground hover:text-foreground">
                    {showOverviewPanels ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    <span className="sr-only">Ocultar/Mostrar paneles de resumen</span>
                </Button>
            </div>
            
            {showOverviewPanels && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <OficinaOverview
                    juanfran={juanfranPending}
                    sandra={sandraPending}
                    jordan={jordanPending}
                    dani={daniPending}
                    chats={unreadChats}
                    julian={julianPending}
                />
                <SeguimientoOverview
                    llamarEstaSemana={llamarEstaSemana}
                    totalSeguimientos={totalSeguimientos}
                    ofrecerArquitecto={ofrecerArquitecto}
                    buscarTerreno={buscarTerreno}
                />
                <BudgetOverview
                    pending={budgetsPending}
                    accepted={budgetsAccepted}
                    rejected={budgetsRejected}
                    done={budgetsDone}
                    sent={budgetsSent}
                />
                <FormOverview
                    total={formsTotal}
                    called={manualAndPriorityCalled}
                    pending={manualAndPriorityPending}
                />
                </div>
            )}
            
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}

              clients={clients}
              onAddClient={(client) => handleCreate('clients', client, 'Obra Nueva')}
              onUpdateClient={(client) => handleUpdate('clients', client, 'Obra Nueva')}
              onDeleteClient={(id) => handleDelete('clients', id, 'Obra Nueva')}
              onCreateBudgetFromClient={handleCreateBudgetFromClient}
              onCreateSeguimientoFromClient={handleCreateSeguimientoFromClient}
              
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
              onAddCollaborator={(collaborator) => handleCreate('collaborators', collaborator, 'Arquitecto')}
              onUpdateCollaborator={(collaborator) => handleUpdate('collaborators', collaborator, 'Arquitecto')}
              onDeleteCollaborator={(id) => handleDelete('collaborators', id, 'Arquitecto')}
              
              interioristas={interioristas}
              onAddInteriorista={(interiorista) => handleCreate('interioristas', interiorista, 'Interiorista')}
              onUpdateInteriorista={(interiorista) => handleUpdate('interioristas', interiorista, 'Interiorista')}
              onDeleteInteriorista={(id) => handleDelete('interioristas', id, 'Interiorista')}
              
              constructoras={constructoras}
              onAddConstructora={(constructora) => handleCreate('constructoras', constructora, 'Constructora')}
              onUpdateConstructora={(constructora) => handleUpdate('constructoras', constructora, 'Constructora')}
              onDeleteConstructora={(id) => handleDelete('constructoras', id, 'Constructora')}

              reformistas={reformistas}
              onAddReformista={(reformista) => handleCreate('reformistas', reformista, 'Reformista')}
              onUpdateReformista={(reformista) => handleUpdate('reformistas', reformista, 'Reformista')}
              onDeleteReformista={(id) => handleDelete('reformistas', id, 'Reformista')}

              inmobiliarias={inmobiliarias}
              onAddInmobiliaria={(inmobiliaria) => handleCreate('inmobiliarias', inmobiliaria, 'Inmobiliaria')}
              onUpdateInmobiliaria={(inmobiliaria) => handleUpdate('inmobiliarias', inmobiliaria, 'Inmobiliaria')}
              onDeleteInmobiliaria={(id) => handleDelete('inmobiliarias', id, 'Inmobiliaria')}

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
              onAddBudget={(budget) => handleCreate('budgets', {...budget, m2: budget.m2 || 0, documents: budget.documents || [] }, 'Presupuesto')}
              onUpdateBudget={(budget) => handleUpdate('budgets', budget, 'Presupuesto')}
              onDeleteBudget={(id) => handleDelete('budgets', id, 'Presupuesto')}

              companies={companies}
              onAddCompany={(company) => handleCreate('companies', company, 'Empresa')}
              onUpdateCompany={(company) => handleUpdate('companies', company, 'Empresa')}
              onDeleteCompany={(id) => handleDelete('companies', id, 'Empresa')}

              documents={documents}
              onAddDocument={(doc) => handleCreate('documents', doc, 'Documento')}
              onDeleteDocument={(id) => handleDelete('documents', id, 'Documento')}

              seguimientos={seguimientos}
              onAddSeguimiento={(seguimiento) => handleCreate('seguimientos', seguimiento, 'Seguimiento')}
              onUpdateSeguimiento={(seguimiento) => handleUpdate('seguimientos', seguimiento, 'Seguimiento')}
              onDeleteSeguimiento={(id) => handleDelete('seguimientos', id, 'Seguimiento')}
              estadoOptions={estadoOptions}
              porHacerOptions={porHacerOptions}
              seguimientoCategories={seguimientoCategories}
              onSeguimientoOptionsChange={handleSeguimientoOptionsChange}
              
              juanfranNotes={juanfranNotes}
              onAddJuanfranNote={(note) => handleCreate('juanfran_notes', note, 'Apunte de Juanfran')}
              onUpdateJuanfranNote={(note) => handleUpdate('juanfran_notes', note, 'Apunte de Juanfran')}
              onDeleteJuanfranNote={(id) => handleDelete('juanfran_notes', id, 'Apunte de Juanfran')}
              
              julianNotes={julianNotes}
              onAddJulianNote={(note) => handleCreate('julian_notes', note, 'Apunte de Julian')}
              onUpdateJulianNote={(note) => handleUpdate('julian_notes', note, 'Apunte de Julian')}
              onDeleteJulianNote={(id) => handleDelete('julian_notes', id, 'Apunte de Julian')}

              sandraNotes={sandraNotes}
              onAddSandraNote={(note) => handleCreate('sandra_notes', note, 'Nota de Sandra')}
              onUpdateSandraNote={(note) => handleUpdate('sandra_notes', note, 'Nota de Sandra')}
              onDeleteSandraNote={(id) => handleDelete('sandra_notes', id, 'Nota de Sandra')}

              jordanChecklists={jordanChecklists}
              onAddJordanChecklist={(checklist) => handleCreate('jordan_checklists', checklist, 'Checklist de Jordan')}
              onUpdateJordanChecklist={(checklist) => handleUpdate('jordan_checklists', checklist, 'Checklist de Jordan')}
              onDeleteJordanChecklist={(id) => handleDelete('jordan_checklists', id, 'Checklist de Jordan')}
              
              daniPriorities={daniPriorities}
              onAddDaniPriority={(priority) => handleCreate('dani_priorities', priority, 'Prioridad de Dani')}
              onUpdateDaniPriority={(priority) => handleUpdate('dani_priorities', priority, 'Prioridad de Dani')}
              onDeleteDaniPriority={(id) => handleDelete('dani_priorities', id, 'Prioridad de Dani')}

              chatMessages={chatMessages}
              onAddChatMessage={(message) => handleCreate('chat_messages', message, 'Mensaje de Chat')}
              onUpdateChatMessage={(message) => handleUpdate('chat_messages', message, 'Mensaje de Chat')}
              onDeleteChatMessage={(id) => handleDelete('chat_messages', id, 'Mensaje de Chat')}
              
              onCreateBudgetFromAi={handleCreateBudgetFromAi}
              onCreateSummaryBudgetFromAi={(aiBudget) => {
                const dialog = document.createElement('div');
                dialog.innerHTML = `
                    <div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center;">
                        <div style="background: white; padding: 2rem; border-radius: 0.5rem; color: black;">
                            <h3 style="font-size: 1.25rem; font-weight: 600;">Añadir a...</h3>
                            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                                <button id="summary-obra-nueva" style="padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 0.25rem;">Obra Nueva</button>
                                <button id="summary-reformas" style="padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 0.25rem;">Reformas</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(dialog);
                
                const closeDialog = () => document.body.removeChild(dialog);

                document.getElementById('summary-obra-nueva')?.addEventListener('click', () => {
                    handleCreateSummaryBudgetFromAi(aiBudget, 'obra_nueva');
                    closeDialog();
                });
                 document.getElementById('summary-reformas')?.addEventListener('click', () => {
                    handleCreateSummaryBudgetFromAi(aiBudget, 'reformas');
                    closeDialog();
                });
                dialog.addEventListener('click', (e) => {
                    if (e.target === dialog) closeDialog();
                })
              }}
              
              visibleTabs={visibleTabs}
              onTabVisibilityChange={handleTabVisibilityChange}
              
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
