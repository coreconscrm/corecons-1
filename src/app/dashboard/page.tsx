
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, writeBatch, documentId, getDocs } from "firebase/firestore";
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject, getMetadata, getBytes } from "firebase/storage";
import { Header } from "@/components/dashboard/header";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, StickyNote, SquarePen } from 'lucide-react';
import { NotepadSheet } from '@/components/dashboard/notepad-sheet';
import { Button } from "@/components/ui/button";
import { SeguimientoOverview, BudgetOverview, FormOverview, OficinaOverview } from "@/components/dashboard/welcome-banner";
import { isWithinInterval, parse, startOfWeek, endOfWeek, isValid, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Budget, BudgetCategory } from '@/components/dashboard/budgets/budgets-section';
import type { AiBudgetItem } from '@/components/dashboard/ai/ai-section';
import { getDisplayName, type ColumnConfig } from '@/components/dashboard/forms/forms-section';
import Papa from 'papaparse';


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
    estimaciones: true,
    protocols: true,
};

const defaultSeguimientoCategories = [{ name: 'General', visible: true }];

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
    forms: 'forms', // This will now be for manual contacts moved from sheets
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
    diskItems: 'diskItems',
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
    sheetFormStatus: 'sheetFormStatus',
    protocols: 'protocols',
};

// --- Helper Functions ---
function generateStableId(row: any): string {
  // Use a combination of fields that are likely to be unique and stable.
  const timestamp = row['Marca temporal'] || row['Timestamp'] || '';
  const email = row['Correo electrónico'] || row['Email'] || '';
  const phone = row['Teléfono'] || row['Telefono'] || '';
  const name = row['Nombre y apellidos'] || row['Nombre'] || '';
  return `${timestamp}-${email}-${phone}-${name}`.replace(/[^a-zA-Z0-9-_]/g, '');
}


// Main Page Component
export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // States for data collections
  const [data, setData] = useState<any>({
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
    forms: [], // Now for manually moved/created contacts, not from sheet directly
    sheetForms: [], // New state for forms loaded from Google Sheet
    contacts: [],
    priorityCalls: [],
    seguimientos: [],
    seguimientoEstadoOptions: ['buscar terreno', 'esperando'],
    seguimientoPorHacerOptions: ['llamar', 'buscar arquitecto'],
    seguimientoCategories: defaultSeguimientoCategories,
    clientCategories: ['En Contacto', 'Ayudando', 'Presupuestando', 'Firmado', 'Construyendo', 'Finalizado'],
    budgets: [],
    companies: [],
    documents: [],
    diskItems: [],
    juanfranNotes: [],
    sandraNotes: [],
    jordanChecklists: [],
    daniPriorities: [],
    chatMessages: [],
    julianNotes: [],
    aiBudgets: [],
    aPresentar: [],
    companyLinks: [],
    linkSections: [],
    estimaciones: [],
    sheetFormStatus: {},
    protocols: [],
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const fetchDiskItems = useCallback(async (path: string = 'disco/') => {
    try {
        const diskRef = ref(storage, path);
        const res = await listAll(diskRef);
        
        const folders = res.prefixes.map(folderRef => ({
            name: folderRef.name,
            type: 'folder' as const,
            path: folderRef.fullPath
        }));
        
        const files = await Promise.all(res.items.map(async itemRef => {
            const metadata = await getMetadata(itemRef);
            const url = await getDownloadURL(itemRef);
            return {
                name: itemRef.name,
                type: 'file' as const,
                path: itemRef.fullPath,
                url: url,
                fileType: metadata.contentType,
                size: metadata.size,
                updated: metadata.updated,
            };
        }));

        return [...folders, ...files].filter(item => !item.name.endsWith('.placeholder'));
    } catch (error) {
        console.error("Error fetching disk items:", error);
        return [];
    }
  }, []);

  const fetchAllDiskItems = useCallback(async () => {
    const rootItems = await fetchDiskItems();
    setData(prev => ({...prev, diskItems: rootItems}));
  }, [fetchDiskItems]);


  // Fetch all data from Firestore
  useEffect(() => {
    if (!user) return; // Don't fetch data if not logged in
    
    setIsLoading(true);
    const unsubscribers: (() => void)[] = [];

    // Set up real-time listeners for all collections
    for (const [collectionName, stateKey] of Object.entries(collectionStateMap)) {
      if (['seguimientoCategories', 'seguimientoEstadoOptions', 'seguimientoPorHacerOptions', 'clientCategories', 'diskItems', 'sheetFormStatus'].includes(collectionName)) continue;

      let q;
      if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar', 'company_links', 'link_sections', 'protocols'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy("date", "desc"));
      } else if (collectionName === 'seguimientos') {
        q = query(collection(db, collectionName)); 
      } else if (['contacts', 'priority_calls', 'forms'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      } else if (collectionName === 'estimaciones') {
        q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
      } else {
        q = query(collection(db, collectionName));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const collectionData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setData(prevData => ({ ...prevData, [stateKey]: collectionData }));
      }, (error) => {
          console.error(`Error fetching ${collectionName}:`, error);
          toast({ variant: 'destructive', title: `Error de Conexión (${collectionName})`, description: "No se pudieron cargar los datos en tiempo real."});
      });
      unsubscribers.push(unsubscribe);
    }
    
    // Listener for sheet form statuses
    const statusUnsubscribe = onSnapshot(collection(db, 'sheetFormStatus'), (snapshot) => {
        const statusData: { [key: string]: any } = {};
        snapshot.forEach(doc => {
            statusData[doc.id] = doc.data();
        });
        setData(prevData => ({ ...prevData, sheetFormStatus: statusData }));
    });
    unsubscribers.push(statusUnsubscribe);

    const fetchConfigs = async () => {
        try {
            // Fetch settings and other single-document configs
            const settingsDocRef = doc(db, 'config', 'dashboardSettings');
            const settingsDocSnap = await getDoc(settingsDocRef);
            if (settingsDocSnap.exists()) {
                const settingsData = settingsDocSnap.data();
                setVisibleTabs(prev => ({ ...prev, ...(settingsData.visibleTabs || {}) }));
                setShowOverviewPanels(settingsData.showOverviewPanels ?? true);
            }

            const segOptionsDocRef = doc(db, 'config', 'seguimientoOptions');
            const segOptionsDocSnap = await getDoc(segOptionsDocRef);
            if (segOptionsDocSnap.exists()) {
                const optionsData = segOptionsDocSnap.data();
                const rawCategories = optionsData.categories || defaultSeguimientoCategories;
                const standardizedCategories = rawCategories.map((cat: any) => typeof cat === 'string' ? { name: cat, visible: true } : cat);
                if (!standardizedCategories.some((cat: any) => cat.name === 'General')) {
                    standardizedCategories.unshift({ name: 'General', visible: true });
                }
                setData(prev => ({
                    ...prev,
                    seguimientoEstadoOptions: optionsData.estadoOptions || [],
                    seguimientoPorHacerOptions: optionsData.porHacerOptions || [],
                    seguimientoCategories: standardizedCategories
                }));
            } else {
                 setData(prev => ({...prev, seguimientoCategories: defaultSeguimientoCategories }));
            }

            const clientCategoriesDocRef = doc(db, 'config', 'clientCategories');
            const clientCategoriesDocSnap = await getDoc(clientCategoriesDocRef);
            if (clientCategoriesDocSnap.exists()) {
                setData(prev => ({...prev, clientCategories: clientCategoriesDocSnap.data().categories || ['En Contacto', 'Ayudando', 'Presupuestando', 'Firmado', 'Construyendo', 'Finalizado']}))
            }
            
            const sheetConfigDocRef = doc(db, 'config', 'googleSheet');
            const sheetConfigDocSnap = await getDoc(sheetConfigDocRef);
            setData(prev => ({...prev, sheetUrl: sheetConfigDocSnap.exists() ? sheetConfigDocSnap.data().url : ''}));
            
            // Fetch column configurations
            const formColsDoc = await getDoc(doc(db, 'config', 'formsColumns'));
            if (formColsDoc.exists()) setData(prev => ({...prev, formCols: formColsDoc.data().columns}));
            const contactColsDoc = await getDoc(doc(db, 'config', 'contactsColumns'));
            if (contactColsDoc.exists()) setData(prev => ({...prev, contactCols: contactColsDoc.data().columns}));
            const priorityColsDoc = await getDoc(doc(db, 'config', 'priority_callsColumns'));
            if (priorityColsDoc.exists()) setData(prev => ({...prev, priorityCols: priorityColsDoc.data().columns}));
            
            await fetchAllDiskItems();
        } catch (error) {
             console.error("Failed to fetch configs from Firebase:", error);
             toast({ variant: 'destructive', title: "Error de Configuración", description: "No se pudieron cargar las configuraciones."});
        } finally {
             setIsLoading(false);
        }
    };
    
    fetchConfigs();

    // Cleanup listeners on component unmount
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };

  }, [fetchAllDiskItems, toast, refreshTrigger, user]);

   // Fetch and parse Google Sheet data
    useEffect(() => {
        if (!user) return;
        if (data.sheetUrl) {
            Papa.parse(data.sheetUrl, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data) {
                        const formsWithStableIds = (results.data as any[]).map((row, index) => {
                            const stableId = generateStableId(row);
                            return { 
                                ...row, 
                                id: stableId, // Use stable ID for the row
                                called: data.sheetFormStatus[stableId]?.called || false
                            };
                        });
                        
                        let headers = results.meta.fields || [];
                        if (!headers.includes('called')) {
                            headers.unshift('called');
                        }
                        
                        setData(prev => ({
                            ...prev,
                            sheetForms: formsWithStableIds,
                            formCols: prev.formCols.length > 0 ? prev.formCols : headers.map(h => ({ key: h, visible: true, displayName: getDisplayName(h) }))
                        }));
                    }
                },
                error: (err) => {
                    toast({ variant: "destructive", title: "Error al leer Google Sheet", description: `No se pudo acceder a la URL. Verifica que esté publicada correctamente. Error: ${(err as Error).message}` });
                },
            });
        } else {
             setData(prev => ({...prev, sheetForms: [] })); // Clear sheet data if URL is removed
        }
    }, [data.sheetUrl, toast, data.sheetFormStatus, user]);
    
    // Initialize column configs if they are empty
    useEffect(() => {
        if (!user) return;
        if (data.contacts.length > 0 && data.contactCols.length === 0) {
            const headers = Object.keys(data.contacts[0]).filter(k => k !== 'id');
            setData(prev => ({ ...prev, contactCols: headers.map(h => ({ key: h, visible: true, displayName: getDisplayName(h) })) }));
        }
         if (data.priorityCalls.length > 0 && data.priorityCols.length === 0) {
            const headers = Object.keys(data.priorityCalls[0]).filter(k => k !== 'id');
            setData(prev => ({ ...prev, priorityCols: headers.map(h => ({ key: h, visible: true, displayName: getDisplayName(h) })) }));
        }
    }, [data.contacts, data.priorityCalls, data.contactCols, data.priorityCols, user]);
  
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
  
  const handleSeguimientoOptionsChange = async (type: 'estado' | 'porHacer' | 'categories', options: any[]) => {
      const dbKey = type === 'estado' ? 'estadoOptions' : (type === 'porHacer' ? 'porHacerOptions' : 'categories');
      try {
          const docRef = doc(db, 'config', 'seguimientoOptions');
          await setDoc(docRef, { [dbKey]: options }, { merge: true });
          
          setRefreshTrigger(prev => prev + 1);
          
          toast({ title: "Opciones guardadas", description: "Las nuevas opciones se han guardado correctamente." });
      } catch (error) {
          console.error("Error saving seguimiento options:", error);
          toast({ variant: "destructive", title: "Error al guardar opciones", description: (error as Error).message });
      }
  };
  
  const handleClientCategoriesChange = async (categories: string[]) => {
        try {
            const docRef = doc(db, 'config', 'clientCategories');
            await setDoc(docRef, { categories }, { merge: true });
            toast({ title: "Subsecciones guardadas", description: "Las nuevas subsecciones se han guardado correctamente." });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error saving client categories:", error);
            toast({ variant: "destructive", title: "Error al guardar subsecciones", description: (error as Error).message });
        }
    };

  const createItem = useCallback(async (collectionName: string, itemData: any) => {
    const dataToSave = { ...itemData };
    if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar', 'company_links', 'link_sections', 'protocols'].includes(collectionName)) {
        if (!dataToSave.date) {
            dataToSave.date = Timestamp.now();
        }
    }
    if (['contacts', 'priority_calls', 'forms', 'estimaciones'].includes(collectionName)) {
        if (!dataToSave.createdAt) {
            dataToSave.createdAt = Timestamp.now();
        }
    }

    try {
        await addDoc(collection(db, collectionName), dataToSave);
        toast({ title: "Elemento añadido", description: "El nuevo elemento se ha guardado correctamente." });
    } catch (error) {
        console.error(`Error adding item to ${collectionName}:`, error);
        toast({ variant: 'destructive', title: "Error al añadir", description: (error as Error).message });
    }
}, [toast]);


  const updateItem = useCallback(async (collectionName: string, itemData: any, refresh: boolean = true) => {
    const { id, ...data } = itemData;
    if (!id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se puede actualizar un elemento sin ID.'});
        return;
    }
    try {
        const itemRef = doc(db, collectionName, id);
        await updateDoc(itemRef, data);
        if (refresh) {
            toast({ title: "Elemento actualizado", description: "Los cambios se han guardado correctamente." });
        }
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
        toast({ variant: 'destructive', title: "Error al actualizar", description: (error as Error).message });
    }
  }, [toast]);
  
  const handleUpdateSheetFormStatus = useCallback(async (item: any) => {
    const { id, called } = item;
    if (!id) return;
    try {
      await setDoc(doc(db, 'sheetFormStatus', id), { called }, { merge: true });
    } catch (error) {
       console.error(`Error updating sheet form status for ${id}:`, error);
       toast({ variant: 'destructive', title: "Error al actualizar estado", description: (error as Error).message });
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
  
  const handleColumnConfigChange = useCallback(async (type: 'forms' | 'contacts' | 'priority_calls', columns: ColumnConfig[]) => {
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

  const handleCreateSeguimientoFromContact = useCallback(async (contact: any, from: 'contacts' | 'priority_calls' | 'forms') => {
      // Helper to find a value by checking multiple possible keys
      const findValue = (obj: any, keys: string[]) => {
          for (const key of keys) {
              if (obj[key]) return obj[key];
          }
          return '';
      };
      
      const newSeguimiento = {
          name: findValue(contact, ['Nombre y apellidos', 'Nombre']),
          phone: findValue(contact, ['Teléfono', 'Telefono']),
          email: findValue(contact, ['Email', 'Correo electrónico']),
          localizacion: findValue(contact, ['Localidad', 'Ciudad']),
          informacion: `Contacto desde ${from === 'forms' ? 'Formularios Web' : (from === 'contacts' ? 'Contactos Manuales' : 'Añadidos a seguimiento')}.
---
DATOS ORIGINALES:
${JSON.stringify(contact, null, 2)}`,
          estado: "Contactado",
          porHacer: "Llamar",
          siguienteLlamada: null,
          category: "General",
      };

      const batch = writeBatch(db);
      const segRef = doc(collection(db, 'seguimientos'));
      batch.set(segRef, newSeguimiento);
      
      if (from !== 'forms') {
        const contactRef = doc(db, from, contact.id);
        batch.delete(contactRef);
      }
      
      await batch.commit();
      toast({ title: 'Movido a Seguimiento', description: `${newSeguimiento.name} ahora está en la lista de seguimiento.` });
  }, [toast]);
  
    const handleMoveFormContact = useCallback(async (formItem: any, destination: 'contacts' | 'priority_calls') => {
        const { id, ...data } = formItem;
        
        try {
            await addDoc(collection(db, destination), {...data, createdAt: Timestamp.now()});
            const destinationName = destination === 'contacts' ? 'Contactos Manuales' : 'Añadidos a seguimiento';
            toast({ title: 'Contacto movido', description: `El contacto ha sido movido a ${destinationName}.` });
        } catch (error) {
            console.error(`Error moving contact from forms:`, error);
            toast({ variant: 'destructive', title: "Error al mover", description: (error as Error).message });
        }
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

    const handleDiskUpload = useCallback(async (path: string, file: File) => {
        const fullPath = `${path}${file.name}`;
        const fileRef = ref(storage, fullPath);
        await uploadBytes(fileRef, file);
        await fetchAllDiskItems(); 
        toast({ title: 'Archivo Subido', description: `Se ha subido ${file.name}.` });
    }, [fetchAllDiskItems, toast]);

    const handleDiskCreateFolder = useCallback(async (path: string, folderName: string) => {
        const placeholderPath = `${path}${folderName}/.placeholder`;
        const placeholderRef = ref(storage, placeholderPath);
        await uploadBytes(placeholderRef, new Blob([], { type: 'application/octet-stream' }));
        await fetchAllDiskItems();
        toast({ title: 'Carpeta Creada', description: `Se ha creado la carpeta ${folderName}.` });
    }, [fetchAllDiskItems, toast]);
    
    const deleteFolderContents = async (folderPath: string) => {
        const folderRef = ref(storage, folderPath);
        const res = await listAll(folderRef);
        await Promise.all(res.items.map(itemRef => deleteObject(itemRef)));
        await Promise.all(res.prefixes.map(prefixRef => deleteFolderContents(prefixRef.fullPath)));
    };

    const handleDiskDeleteItem = useCallback(async (path: string, type: 'file' | 'folder') => {
        if (type === 'file') {
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
        } else { // folder
            await deleteFolderContents(path);
        }
        await fetchAllDiskItems();
        toast({ title: 'Elemento Eliminado' });
    }, [fetchAllDiskItems, toast]);
    
    const handleMoveAiPartida = useCallback(async (budgetId: string, source: any, destination: any) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));
        
        const sourceChapter = newBreakdown.capitulos.find((c: any) => c.nombre === source.droppableId);
        if (!sourceChapter) return;
        const [movedItem] = sourceChapter.partidas.splice(source.index, 1);

        // If moving to a different chapter
        if (source.droppableId !== destination.droppableId) {
            const destChapter = newBreakdown.capitulos.find((c: any) => c.nombre === destination.droppableId);
            if (!destChapter) return;
            destChapter.partidas.splice(destination.index, 0, movedItem);

            // Move totals
            if (newTotals[sourceChapter.nombre] && newTotals[sourceChapter.nombre][movedItem.descripcion] !== undefined) {
                if (!newTotals[destChapter.nombre]) {
                    newTotals[destChapter.nombre] = {};
                }
                newTotals[destChapter.nombre][movedItem.descripcion] = newTotals[sourceChapter.nombre][movedItem.descripcion];
                delete newTotals[sourceChapter.nombre][movedItem.descripcion];
            }
        } else { // Moving within the same chapter
            sourceChapter.partidas.splice(destination.index, 0, movedItem);
        }
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals });
        
    }, [data.aiBudgets, updateItem]);

    const handleMergeAiChapters = useCallback(async (budgetId: string, sourceChapterName: string, targetChapterName: string) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));

        const sourceChapterIndex = newBreakdown.capitulos.findIndex((c: any) => c.nombre === sourceChapterName);
        const targetChapterIndex = newBreakdown.capitulos.findIndex((c: any) => c.nombre === targetChapterName);

        if (sourceChapterIndex === -1 || targetChapterIndex === -1) return;

        const sourceChapter = newBreakdown.capitulos[sourceChapterIndex];
        const targetChapter = newBreakdown.capitulos[targetChapterIndex];

        // Move partidas
        targetChapter.partidas.push(...sourceChapter.partidas);

        // Move totals
        if (newTotals[sourceChapterName]) {
            if (!newTotals[targetChapterName]) {
                newTotals[targetChapterName] = {};
            }
            Object.assign(newTotals[targetChapterName], newTotals[sourceChapterName]);
            delete newTotals[sourceChapterName];
        }

        // Remove source chapter
        newBreakdown.capitulos.splice(sourceChapterIndex, 1);
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals }, true);
        toast({ title: "Capítulos unidos", description: `Se ha unido "${sourceChapterName}" con "${targetChapterName}".` });

    }, [data.aiBudgets, updateItem, toast]);
    
    const handleDeleteAiPartida = useCallback(async (budgetId: string, chapterName: string, partidaIndex: number) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));
        
        const chapter = newBreakdown.capitulos.find((c: any) => c.nombre === chapterName);
        if (!chapter || !chapter.partidas[partidaIndex]) return;

        const partidaToDelete = chapter.partidas[partidaIndex];
        
        // Remove from totals
        if (newTotals[chapterName] && newTotals[chapterName][partidaToDelete.descripcion] !== undefined) {
            delete newTotals[chapterName][partidaToDelete.descripcion];
        }

        // Remove partida
        chapter.partidas.splice(partidaIndex, 1);
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals });
        toast({ title: "Partida eliminada", description: `La partida ha sido eliminada.` });

    }, [data.aiBudgets, updateItem, toast]);

    const handleDeleteAiChapter = useCallback(async (budgetId: string, chapterName: string) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));

        // Filter out the chapter to delete
        newBreakdown.capitulos = newBreakdown.capitulos.filter((c: any) => c.nombre !== chapterName);

        // Delete totals for that chapter
        if (newTotals[chapterName]) {
            delete newTotals[chapterName];
        }
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals });
        toast({ title: "Capítulo eliminado", description: `El capítulo "${chapterName}" y todas sus partidas han sido eliminados.` });

    }, [data.aiBudgets, updateItem, toast]);


    const handleUpdateAiBudget = useCallback(async (budget: AiBudgetItem, refresh: boolean = true) => {
        await updateItem('ia_budgets', budget, refresh);
    }, [updateItem]);


    const handleBulkDeleteAiPartidas = useCallback(async (budgetId: string, partidaIds: string[]) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));

        const partidaKeysToDelete = new Set(partidaIds);

        newBreakdown.capitulos.forEach((chapter: any) => {
            const originalPartidas = chapter.partidas;
            chapter.partidas = [];
            
            originalPartidas.forEach((partida: any, index: number) => {
                const partidaId = `${chapter.nombre}---${partida.descripcion}---${index}`;
                if (partidaKeysToDelete.has(partidaId)) {
                    // This one is being deleted, remove its total
                    if (newTotals[chapter.nombre]?.[partida.descripcion] !== undefined) {
                        delete newTotals[chapter.nombre][partida.descripcion];
                    }
                } else {
                    // This one is kept
                    chapter.partidas.push(partida);
                }
            });
        });
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals });
        toast({ title: "Partidas eliminadas", description: `${partidaIds.length} partidas han sido eliminadas.` });

    }, [data.aiBudgets, updateItem, toast]);
    
    const handleBulkMoveAiPartidas = useCallback(async (budgetId: string, partidaIds: string[], targetChapterName: string) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));
        
        const targetChapter = newBreakdown.capitulos.find((c: any) => c.nombre === targetChapterName);
        if (!targetChapter) return;
        
        const partidasToMove: any[] = [];
        const partidaKeysToDelete = new Set(partidaIds);

        newBreakdown.capitulos.forEach((chapter: any) => {
            const originalPartidas = chapter.partidas;
            chapter.partidas = [];
            
            originalPartidas.forEach((partida: any, index: number) => {
                const partidaId = `${chapter.nombre}---${partida.descripcion}---${index}`;
                if (partidaKeysToDelete.has(partidaId)) {
                    partidasToMove.push(partida);
                    // Move total
                    if (newTotals[chapter.nombre]?.[partida.descripcion] !== undefined) {
                        if (!newTotals[targetChapter.nombre]) newTotals[targetChapter.nombre] = {};
                        newTotals[targetChapter.nombre][partida.descripcion] = newTotals[chapter.nombre][partida.descripcion];
                        delete newTotals[chapter.nombre][partida.descripcion];
                    }
                } else {
                    chapter.partidas.push(partida);
                }
            });
        });
        
        targetChapter.partidas.push(...partidasToMove);

        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals });
        toast({ title: "Partidas movidas", description: `${partidaIds.length} partidas movidas a "${targetChapterName}".` });

    }, [data.aiBudgets, updateItem, toast]);


  // Metrics for Budget Overview
  const budgetsPending = data.budgets.filter((b:any) => b.status === 'Pendiente').length;
  const budgetsAccepted = data.budgets.filter((b:any) => b.status === 'Aceptado').length;
  const budgetsRejected = data.budgets.filter((b:any) => b.status === 'Rechazado').length;
  const budgetsDone = data.budgets.filter((b:any) => b.status === 'Hechos').length;
  const budgetsSent = data.budgets.filter((b:any) => b.status === 'Enviados').length;

  // Metrics for Form Overview
  const formsTotal = data.sheetForms.length;
  const manualAndPriorityTotal = data.contacts.length + data.priorityCalls.length;
  const manualAndPriorityCalled = data.contacts.filter((c:any) => c.called).length + data.priorityCalls.filter((pc:any) => pc.called).length;
  const sheetFormsCalled = data.sheetForms.filter((f: any) => f.called).length;
  const totalCalled = manualAndPriorityCalled + sheetFormsCalled;
  const totalPending = (formsTotal + manualAndPriorityTotal) - totalCalled;


  // Metrics for Seguimiento Overview
  const activeSeguimientos = data.seguimientos.filter((s: any) => !s.archived);
  const totalSeguimientos = activeSeguimientos.length;
  
  const llamarEstaSemana = activeSeguimientos.filter((s: any) => {
    if (!s.siguienteLlamada || typeof s.siguienteLlamada !== 'string') return false;
    const nextCallDate = parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date());
    if (!isValid(nextCallDate)) return false;
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { locale: es, weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { locale: es, weekStartsOn: 1 });
    return isWithinInterval(nextCallDate, { start: startOfThisWeek, end: endOfThisWeek });
  }).length;
  
  const aPresentarHoy = data.aPresentar.filter((p: any) => {
    if (!p.presentationDate || !p.presentationDate.toDate) return false;
    return isToday(p.presentationDate.toDate());
  }).length;
  
  const seguimientoMetrics = (data.seguimientoCategories || [])
    .filter((cat: any) => cat.visible)
    .reduce((acc: any, category: any) => {
        acc[category.name] = activeSeguimientos.filter((s: any) => s.category === category.name).length;
        return acc;
    }, {});

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
  
  if (authLoading || (!user && !isLoading)) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

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
                      customMetrics={seguimientoMetrics}
                      aPresentarHoy={aPresentarHoy}
                  />
                  <BudgetOverview
                      pending={budgetsPending}
                      accepted={budgetsAccepted}
                      rejected={budgetsRejected}
                      done={budgetsDone}
                      sent={budgetsSent}
                  />
                  <FormOverview
                      total={formsTotal + manualAndPriorityTotal}
                      called={totalCalled}
                      pending={totalPending}
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
                handleClientCategoriesChange,
                handleCreateBudgetFromAi,
                handleCreateSummaryBudgetFromAi,
                handleMoveFormContact,
                handleDiskUpload,
                handleDiskCreateFolder,
                handleDiskDeleteItem,
                fetchDiskItems,
                handleMoveAiPartida,
                handleMergeAiChapters,
                handleDeleteAiPartida,
                handleDeleteAiChapter,
                handleUpdateAiBudget,
                handleUpdateSheetFormStatus,
                handleBulkDeleteAiPartidas,
                handleBulkMoveAiPartidas,
              }}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}

    