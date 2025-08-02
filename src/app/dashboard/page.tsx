
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, writeBatch } from "firebase/firestore";
import { Header } from "@/components/dashboard/header";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, StickyNote } from 'lucide-react';
import { NotepadSheet } from '@/components/dashboard/notepad-sheet';
import { Button } from "@/components/ui/button";
import { SeguimientoOverview, BudgetOverview, FormOverview, OficinaOverview } from "@/components/dashboard/welcome-banner";
import { isWithinInterval, parse, startOfWeek, endOfWeek, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Budget, BudgetCategory } from '@/components/dashboard/budgets/budgets-section';
import type { AiBudgetItem } from '@/components/dashboard/ai/ai-section';

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

// Main Page Component
export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // States for data collections
  const [data, setData] = useState({
    projects: [],
    clients: [],
    reformas: [],
    providers: [],
    collaborators: [],
    interioristas: [],
    constructoras: [],
    reformistas: [],
    inmobiliarias: [],
    team: [],
    forms: [],
    contacts: [],
    priorityCalls: [],
    seguimientos: [],
    seguimientoEstadoOptions: ['buscar terreno', 'esperando'],
    seguimientoPorHacerOptions: ['llamar', 'buscar arquitecto'],
    seguimientoCategories: ['General'],
    budgets: [],
    companies: [],
    documents: [],
    juanfranNotes: [],
    sandraNotes: [],
    jordanChecklists: [],
    daniPriorities: [],
    chatMessages: [],
    julianNotes: [],
    aiBudgets: [],
    sheetUrl: '',
    formCols: [],
    contactCols: [],
    priorityCols: [],
  });

  // States for UI
  const [visibleTabs, setVisibleTabs] = useState(defaultVisibleTabs);
  const [activeTab, setActiveTab] = useState("oficina");
  const [isNotepadOpen, setNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const [showOverviewPanels, setShowOverviewPanels] = useState(true);

  // Fetch all data from Firestore
  useEffect(() => {
    const collections: { [key: string]: string } = {
      projects: "projects",
      clients: "clients",
      reformas: "reformas",
      providers: "providers",
      collaborators: "collaborators",
      interioristas: "interioristas",
      constructoras: "constructoras",
      reformistas: "reformistas",
      inmobiliarias: "inmobiliarias",
      team: "team",
      forms: "forms",
      contacts: "contacts",
      priority_calls: "priority_calls",
      seguimientos: "seguimientos",
      budgets: "budgets",
      companies: "companies",
      documents: "documents",
      juanfran_notes: "juanfran_notes",
      sandra_notes: "sandra_notes",
      jordan_checklists: "jordan_checklists",
      dani_priorities: "dani_priorities",
      chat_messages: "chat_messages",
      julian_notes: "julian_notes",
      ia_budgets: "ia_budgets",
    };

    const unsubscribes = Object.entries(collections).map(([stateKey, collectionName]) => {
      let q;
      if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy("date", "desc"));
      } else if (collectionName === 'seguimientos') {
         q = query(collection(db, collectionName)); // Sorting is handled client-side
      } else if (['contacts', 'priority_calls'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      }
      else {
        q = query(collection(db, collectionName));
      }
      
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData(prevData => ({ ...prevData, [stateKey.replace('_', '')]: items }));
      }, (error) => console.error(`Error fetching ${collectionName}:`, error));
    });

    // Fetch dashboard settings
    const settingsDocRef = doc(db, 'config', 'dashboardSettings');
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const settingsData = docSnap.data();
            setVisibleTabs(prev => ({ ...prev, ...(settingsData.visibleTabs || {}) }));
            setShowOverviewPanels(settingsData.showOverviewPanels ?? true);
        }
        setIsLoading(false);
    });

    // Fetch Seguimiento options
    const segOptionsDocRef = doc(db, 'config', 'seguimientoOptions');
    const unsubSegOptions = onSnapshot(segOptionsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const optionsData = docSnap.data();
            setData(prev => ({
                ...prev,
                seguimientoEstadoOptions: optionsData.estadoOptions || [],
                seguimientoPorHacerOptions: optionsData.porHacerOptions || [],
                seguimientoCategories: optionsData.categories || ['General'],
            }));
        }
    });
    
    // Fetch Google Sheet URL
    const sheetConfigDocRef = doc(db, 'config', 'googleSheet');
    const unsubSheetUrl = onSnapshot(sheetConfigDocRef, (doc) => {
      setData(prev => ({ ...prev, sheetUrl: doc.exists() ? doc.data().url : '' }));
    });
    
    // Fetch Column Configurations
    ['forms', 'contacts', 'priority_calls'].forEach(type => {
        const configDocRef = doc(db, 'config', `${type}Columns`);
        onSnapshot(configDocRef, (docSnap) => {
            if (docSnap.exists()) {
                 const key = type === 'priority_calls' ? 'priorityCols' : `${type.slice(0, -1)}Cols`;
                 setData(prev => ({ ...prev, [key]: docSnap.data().columns }));
            }
        });
    });


    return () => {
      unsubscribes.forEach(unsub => unsub());
      unsubSettings();
      unsubSegOptions();
      unsubSheetUrl();
    };
  }, []);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('mainTab', tab);
  };
  
  useEffect(() => {
    const savedTab = localStorage.getItem('mainTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

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

  const handleToggleOverviewPanels = async (show: boolean) => {
      setShowOverviewPanels(show);
      try {
        const settingsDocRef = doc(db, 'config', 'dashboardSettings');
        await setDoc(settingsDocRef, { showOverviewPanels: show }, { merge: true });
      } catch (error) {
          console.error("Error saving overview panel visibility:", error);
          toast({ variant: 'destructive', title: `Error al guardar`, description: `No se pudieron guardar los cambios. Error: ${(error as Error).message}`});
      }
  };
  
  const handleSeguimientoOptionsChange = async (type: 'estado' | 'porHacer' | 'categories', options: string[]) => {
      const key = type === 'estado' ? 'estadoOptions' : (type === 'porHacer' ? 'porHacerOptions' : 'categories');
      try {
          const docRef = doc(db, 'config', 'seguimientoOptions');
          await setDoc(docRef, { [key]: options }, { merge: true });
          toast({ title: "Opciones guardadas", description: "Las nuevas opciones se han guardado correctamente." });
      } catch (error) {
          console.error("Error saving seguimiento options:", error);
          toast({ variant: "destructive", title: "Error al guardar opciones", description: (error as Error).message });
      }
  };

  const createItem = useCallback(async (collectionName: string, itemData: any) => {
    try {
      await addDoc(collection(db, collectionName), itemData);
      toast({ title: "Elemento añadido", description: "El nuevo elemento se ha guardado correctamente." });
    } catch (error) {
      console.error(`Error adding item to ${collectionName}:`, error);
      toast({ variant: 'destructive', title: "Error al añadir", description: (error as Error).message });
    }
  }, [toast]);

  const updateItem = useCallback(async (collectionName: string, itemData: any) => {
    const { id, ...data } = itemData;
    if (!id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se puede actualizar un elemento sin ID.'});
        return;
    }
    try {
        const itemRef = doc(db, collectionName, id);
        await updateDoc(itemRef, data);
        toast({ title: "Elemento actualizado", description: "Los cambios se han guardado correctamente." });
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
        toast({ variant: 'destructive', title: "Error al actualizar", description: (error as Error).message });
    }
  }, [toast]);

  const deleteItem = useCallback(async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast({ title: "Elemento eliminado", description: "El elemento ha sido borrado." });
    } catch (error) {
      console.error(`Error deleting item ${id} from ${collectionName}:`, error);
      toast({ variant: 'destructive', title: "Error al eliminar", description: (error as Error).message });
    }
  }, [toast]);
  
  const handleSaveSheetUrl = useCallback(async (url: string) => {
    try {
      await setDoc(doc(db, 'config', 'googleSheet'), { url });
      toast({ title: 'URL guardada', description: 'La conexión con Google Sheets se ha actualizado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar URL', description: (error as Error).message });
    }
  }, [toast]);
  
  const handleColumnConfigChange = useCallback(async (type: 'forms' | 'contacts' | 'priority_calls', columns: any[]) => {
      const docId = `${type}Columns`;
      try {
          await setDoc(doc(db, 'config', docId), { columns });
          toast({ title: 'Configuración guardada', description: 'La vista de la tabla ha sido actualizada.' });
      } catch(error) {
          toast({ variant: 'destructive', title: 'Error al guardar', description: (error as Error).message });
      }
  }, [toast]);
  
  const handleCreateBudgetFromClient = useCallback(async (client: any, category: BudgetCategory) => {
        const newBudget: Omit<Budget, 'id'> = {
            name: `Presupuesto para ${client.name}`,
            clientId: client.id,
            companyId: data.companies.length > 0 ? (data.companies[0] as any).id : "",
            status: 'Pendiente',
            m2: 0,
            lineItems: [],
            total: 0,
            category: category,
        };
        await createItem('budgets', newBudget);
  }, [data.companies, createItem]);
  
  const handleCreateSeguimientoFromClient = useCallback(async (client: any) => {
      const newSeguimiento = {
          name: client.name || client.contact,
          phone: client.phone,
          email: client.email,
          localizacion: client.localizacion,
          informacion: `Cliente de ${client.memoria ? 'Obra Nueva' : 'Reforma'}. Info adicional: ${client.infoAdicional || 'N/A'}. Origen: ${client.obtenido || 'N/A'}.`,
          estado: "Contactado",
          porHacer: "Llamar",
          siguienteLlamada: null,
          category: "General",
      };
      await createItem('seguimientos', newSeguimiento);
  }, [createItem]);

  const handleCreateSeguimientoFromContact = useCallback(async (contact: any, from: 'contacts' | 'priority_calls') => {
      const newSeguimiento = {
          name: contact['Nombre y apellidos'] || contact['Nombre'] || 'Sin nombre',
          phone: contact['Teléfono'] || contact['Telefono'],
          email: contact['Email'] || contact['Correo electrónico'],
          localizacion: contact['Localidad'] || '',
          informacion: `Contacto desde ${from === 'contacts' ? 'Contactos Manuales' : 'Llamada Prioritaria'}. Detalles: ${JSON.stringify(contact)}`,
          estado: "Contactado",
          porHacer: "Llamar",
          siguienteLlamada: null,
          category: "General",
      };
      const batch = writeBatch(db);
      const segRef = doc(collection(db, 'seguimientos'));
      batch.set(segRef, newSeguimiento);
      const contactRef = doc(db, from, contact.id);
      batch.delete(contactRef);
      await batch.commit();
      toast({ title: 'Movido a Seguimiento', description: `${newSeguimiento.name} ahora está en la lista de seguimiento.` });
  }, [toast]);
  
  const handleCreateBudgetFromAi = useCallback(async (aiBudget: AiBudgetItem, category: BudgetCategory) => {
        const lineItems = aiBudget.breakdown.capitulos.flatMap(capitulo => ([
            { description: capitulo.nombre, isChapter: true },
            ...capitulo.partidas.map(partida => ({
                description: partida.descripcion,
                quantity: parseFloat(String(partida.medicion).replace(',', '.')) || 0,
                unit: partida.unidad || null,
                unitPrice: aiBudget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0,
                isChapter: false
            }))
        ]));

        const total = Object.values(aiBudget.userLineTotals || {}).flatMap(c => Object.values(c)).reduce((sum, val) => sum + val, 0);

        const newBudget = {
            name: aiBudget.title,
            clientId: "",
            companyId: data.companies.length > 0 ? (data.companies[0] as any).id : "",
            status: 'Pendiente',
            m2: 0,
            lineItems,
            total,
            category,
        };
        await createItem('budgets', newBudget);
  }, [data.companies, createItem]);
  
  const handleCreateSummaryBudgetFromAi = useCallback(async (aiBudget: AiBudgetItem) => {
        const chapterTotals: Record<string, number> = {};
        if (aiBudget.breakdown.capitulos) {
            for (const capitulo of aiBudget.breakdown.capitulos) {
                const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                    const lineTotal = aiBudget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                    return sum + lineTotal;
                }, 0);
                chapterTotals[capitulo.nombre] = chapterTotal;
            }
        }

        const lineItems = Object.entries(chapterTotals).map(([nombre, total]) => ({
            description: nombre,
            isChapter: false,
            unit: 'ud',
            quantity: 1,
            unitPrice: total,
        }));
        
        const total = lineItems.reduce((sum, item) => sum + item.unitPrice, 0);
        
        const newBudget = {
            name: `Resumen de ${aiBudget.title}`,
            clientId: "",
            companyId: data.companies.length > 0 ? (data.companies[0] as any).id : "",
            status: 'Pendiente',
            m2: 0,
            lineItems,
            total,
            category: 'reformas',
        };
        await createItem('budgets', newBudget);
    }, [data.companies, createItem]);


  // Metrics for Budget Overview
  const budgetsPending = data.budgets.filter((b:any) => b.status === 'Pendiente').length;
  const budgetsAccepted = data.budgets.filter((b:any) => b.status === 'Aceptado').length;
  const budgetsRejected = data.budgets.filter((b:any) => b.status === 'Rechazado').length;
  const budgetsDone = data.budgets.filter((b:any) => b.status === 'Hechos').length;
  const budgetsSent = data.budgets.filter((b:any) => b.status === 'Enviados').length;

  // Metrics for Form Overview
  const formsTotal = data.forms.length;
  const manualAndPriorityTotal = data.contacts.length + data.priorityCalls.length;
  const manualAndPriorityCalled = data.contacts.filter((c:any) => c.called).length + data.priorityCalls.filter((pc:any) => pc.called).length;
  const manualAndPriorityPending = manualAndPriorityTotal - manualAndPriorityCalled;

  // Metrics for Seguimiento Overview
  const totalSeguimientos = data.seguimientos.length;
  
  const llamarEstaSemana = data.seguimientos.filter((s: any) => {
    if (!s.siguienteLlamada || typeof s.siguienteLlamada !== 'string') return false;
    const nextCallDate = parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date());
    if (!isValid(nextCallDate)) return false;
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { locale: es, weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { locale: es, weekStartsOn: 1 });
    return isWithinInterval(nextCallDate, { start: startOfThisWeek, end: endOfThisWeek });
  }).length;
  
  const ofrecerArquitecto = data.seguimientos.filter((s:any) => s.porHacer?.toLowerCase().trim() === 'buscar arquitecto').length;
  const buscarTerreno = data.seguimientos.filter((s:any) => s.estado?.toLowerCase().trim() === 'buscar terreno').length;

  // Metrics for Oficina Overview
  const countPending = (items: any[]) => {
    return items.filter(item => {
        if (item.type === 'checklist') {
            return !(item.items || []).every((subItem: any) => subItem.completed);
        }
        return !item.completed;
    }).length;
  };
  
  const juanfranPending = countPending(data.juanfranNotes);
  const julianPending = countPending(data.julianNotes);
  const sandraPending = data.sandraNotes.filter((n:any) => !n.completed).length;
  const jordanPending = countPending(data.jordanChecklists);
  const daniPending = data.daniPriorities.filter((p:any) => !p.completed).length;
  const unreadChats = data.chatMessages.filter((m:any) => !m.read).length;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <NotepadSheet open={isNotepadOpen} onOpenChange={setNotepadOpen} content={notepadContent} onContentChange={setNotepadContent} />
      
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
        onClick={() => setNotepadOpen(true)}
        aria-label="Abrir bloc de notas"
      >
        <StickyNote className="h-5 w-5" />
      </Button>

      <main className="flex-1 p-2 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Conectando con tu base de datos...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">Panel de Control</h1>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleOverviewPanels(!showOverviewPanels)}>
                    {showOverviewPanels ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">Ocultar/Mostrar paneles de resumen</span>
                </Button>
            </div>
            
            {showOverviewPanels && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              visibleTabs={visibleTabs}
              onTabVisibilityChange={handleTabVisibilityChange}
              data={data}
              actions={{
                createItem,
                updateItem,
                deleteItem,
                handleSaveSheetUrl,
                handleColumnConfigChange,
                handleCreateBudgetFromClient,
                handleCreateSeguimientoFromClient,
                handleCreateSeguimientoFromContact,
                handleSeguimientoOptionsChange,
                handleCreateBudgetFromAi,
                handleCreateSummaryBudgetFromAi,
              }}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
