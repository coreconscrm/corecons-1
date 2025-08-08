

"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { getDisplayName } from '@/components/dashboard/forms/forms-section';
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
    forms: 'forms',
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
};

// Main Page Component
export default function Page() {
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
    forms: [],
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
    const fetchAllDataOnce = async () => {
        setIsLoading(true);
        try {
            const newDataState: { [key: string]: any } = {};

            // Fetch all collections using getDocs
            for (const [collectionName, stateKey] of Object.entries(collectionStateMap)) {
                if (['seguimientoCategories', 'seguimientoEstadoOptions', 'seguimientoPorHacerOptions', 'clientCategories', 'diskItems'].includes(collectionName)) continue;
                
                let q;
                if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar', 'company_links', 'link_sections'].includes(collectionName)) {
                  q = query(collection(db, collectionName), orderBy("date", "desc"));
                } else if (collectionName === 'seguimientos') {
                  q = query(collection(db, collectionName)); 
                } else if (['contacts', 'priority_calls'].includes(collectionName)) {
                  q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
                } else if (collectionName === 'forms') {
                  q = query(collection(db, collectionName), orderBy(documentId())); 
                } else if (collectionName === 'estimaciones') {
                  q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
                } else {
                  q = query(collection(db, collectionName));
                }
                
                const snapshot = await getDocs(q);
                newDataState[stateKey] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            }

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
                newDataState.seguimientoEstadoOptions = optionsData.estadoOptions || [];
                newDataState.seguimientoPorHacerOptions = optionsData.porHacerOptions || [];
                newDataState.seguimientoCategories = standardizedCategories;
            } else {
                newDataState.seguimientoCategories = defaultSeguimientoCategories;
            }

            const clientCategoriesDocRef = doc(db, 'config', 'clientCategories');
            const clientCategoriesDocSnap = await getDoc(clientCategoriesDocRef);
            if (clientCategoriesDocSnap.exists()) {
                newDataState.clientCategories = clientCategoriesDocSnap.data().categories || ['En Contacto', 'Ayudando', 'Presupuestando', 'Firmado', 'Construyendo', 'Finalizado'];
            }
            
            const sheetConfigDocRef = doc(db, 'config', 'googleSheet');
            const sheetConfigDocSnap = await getDoc(sheetConfigDocRef);
            newDataState.sheetUrl = sheetConfigDocSnap.exists() ? sheetConfigDocSnap.data().url : '';
            
            // Set all data at once
            setData(prevData => ({ ...prevData, ...newDataState }));

            // Fetch storage items last
            await fetchAllDiskItems();

        } catch (error) {
            console.error("Failed to fetch data from Firebase:", error);
            toast({ variant: 'destructive', title: "Error de Conexión", description: "No se pudieron cargar los datos."});
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchAllDataOnce();

  }, [fetchAllDiskItems, toast, refreshTrigger]);

  const handleLoadForms = useCallback(async (formData: any[]) => {
      if (!formData || formData.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se encontraron datos para cargar.' });
          return;
      }
      
      const createFormIdentifier = (form: any) => {
          const name = form['Nombre'] || form['nombre'] || '';
          const phone = form['Teléfono'] || form['telefono'] || '';
          const email = form['Email'] || form['email'] || '';
          const projectType = form['¿Que Tipo de Proyecto Necesitas?'] || '';
          return `${name}-${phone}-${email}-${projectType}`.toLowerCase().replace(/\s+/g, '');
      };

      const formsCollectionRef = collection(db, "forms");
      const batch = writeBatch(db);
      
      const existingFormsSnapshot = await getDocs(formsCollectionRef);
      const existingFormsMap = new Map();
      existingFormsSnapshot.forEach(doc => {
          const data = doc.data();
          existingFormsMap.set(createFormIdentifier(data), { id: doc.id, ...data });
      });

      const incomingFormIdentifiers = new Set();
      
      formData.forEach(newItem => {
          const identifier = createFormIdentifier(newItem);
          incomingFormIdentifiers.add(identifier);
          const existingForm = existingFormsMap.get(identifier);

          if (!existingForm) {
              const docRef = doc(formsCollectionRef);
              batch.set(docRef, { ...newItem, checked: false });
          }
      });

      existingFormsMap.forEach((form, identifier) => {
          if (!incomingFormIdentifiers.has(identifier)) {
              batch.delete(doc(db, "forms", form.id));
          }
      });

      await batch.commit();
      toast({ title: 'Datos sincronizados', description: `Se han sincronizado los registros desde la hoja.` });
      setRefreshTrigger(prev => prev + 1);
  }, [toast]);

  useEffect(() => {
    if (data.sheetUrl) {
        Papa.parse(data.sheetUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data) {
                    handleLoadForms(results.data);
                }
            },
            error: (err) => {
                toast({ variant: "destructive", title: "Error al leer Google Sheet", description: `No se pudo acceder a la URL. Verifica que esté publicada correctamente. Error: ${(err as Error).message}` });
            },
        });
    }
  }, [data.sheetUrl, handleLoadForms, toast]);
  
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
    if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar', 'company_links', 'link_sections'].includes(collectionName)) {
        if (!dataToSave.date) {
            dataToSave.date = Timestamp.now();
        }
    }
    if (['contacts', 'priority_calls', 'estimaciones'].includes(collectionName)) {
        if (!dataToSave.createdAt) {
            dataToSave.createdAt = Timestamp.now();
        }
    }

    try {
        await addDoc(collection(db, collectionName), dataToSave);
        toast({ title: "Elemento añadido", description: "El nuevo elemento se ha guardado correctamente." });
        setRefreshTrigger(prev => prev + 1);
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
            setRefreshTrigger(prev => prev + 1);
            toast({ title: "Elemento actualizado", description: "Los cambios se han guardado correctamente." });
        }
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
        toast({ variant: 'destructive', title: "Error al actualizar", description: (error as Error).message });
    }
  }, [toast]);

  const deleteItem = useCallback(async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast({ title: "Elemento eliminado", description: "El elemento ha sido borrado." });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(`Error deleting item ${id} from ${collectionName}:`, error);
      toast({ variant: 'destructive', title: "Error al eliminar", description: (error as Error).message });
    }
  }, [toast]);
  
  const handleSaveSheetUrl = useCallback(async (url: string) => {
    try {
      await setDoc(doc(db, 'config', 'googleSheet'), { url });
      toast({ title: 'URL guardada', description: 'La conexión con Google Sheets se ha actualizado.' });
       setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar URL', description: (error as Error).message });
    }
  }, [toast]);
  
  const handleColumnConfigChange = useCallback(async (type: 'forms' | 'contacts' | 'priority_calls', columns: any[]) => {
      const docId = `${type}Columns`;
      try {
          await setDoc(doc(db, 'config', docId), { columns });
          toast({ title: 'Configuración guardada', description: 'La vista de la tabla ha sido actualizada.' });
           setRefreshTrigger(prev => prev + 1);
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
          informacion: `Contacto desde ${from === 'contacts' ? 'Contactos Manuales' : 'Añadidos a seguimiento'}. Detalles: ${JSON.stringify(contact)}`,
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
      setRefreshTrigger(prev => prev + 1);
  }, [toast]);
  
    const handleMoveFormContact = useCallback(async (formItem: any, destination: 'contacts' | 'priority_calls') => {
        const { id, ...data } = formItem;
        if (!id) {
            toast({ variant: 'destructive', title: 'Error', description: 'El elemento del formulario no tiene ID.' });
            return;
        }

        const batch = writeBatch(db);

        const newDocRef = doc(collection(db, destination));
        batch.set(newDocRef, { ...data, createdAt: Timestamp.now() });

        const oldDocRef = doc(db, 'forms', id);
        batch.delete(oldDocRef);

        try {
            await batch.commit();
            const destinationName = destination === 'contacts' ? 'Contactos Manuales' : 'Añadidos a seguimiento';
            toast({ title: 'Contacto movido', description: `El contacto ha sido movido a ${destinationName}.` });
            setRefreshTrigger(prev => prev + 1);
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
        setRefreshTrigger(prev => prev + 1);
    }, [fetchAllDiskItems, toast]);

    const handleDiskCreateFolder = useCallback(async (path: string, folderName: string) => {
        const placeholderPath = `${path}${folderName}/.placeholder`;
        const placeholderRef = ref(storage, placeholderPath);
        await uploadBytes(placeholderRef, new Blob([], { type: 'application/octet-stream' }));
        await fetchAllDiskItems();
        toast({ title: 'Carpeta Creada', description: `Se ha creado la carpeta ${folderName}.` });
        setRefreshTrigger(prev => prev + 1);
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
        setRefreshTrigger(prev => prev + 1);
    }, [fetchAllDiskItems, toast]);
    
    const handleMoveAiPartida = useCallback(async (budgetId: string, source: any, destination: any) => {
        const budget = data.aiBudgets.find((b: AiBudgetItem) => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        
        const sourceChapter = newBreakdown.capitulos.find((c: any) => c.nombre === source.droppableId);
        const destChapter = newBreakdown.capitulos.find((c: any) => c.nombre === destination.droppableId);
        if (!sourceChapter || !destChapter) return;

        const [movedItem] = sourceChapter.partidas.splice(source.index, 1);
        destChapter.partidas.splice(destination.index, 0, movedItem);
        
        const newTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));
        if (newTotals[sourceChapter.nombre] && newTotals[sourceChapter.nombre][movedItem.descripcion] !== undefined) {
            if (!newTotals[destChapter.nombre]) {
                newTotals[destChapter.nombre] = {};
            }
            newTotals[destChapter.nombre][movedItem.descripcion] = newTotals[sourceChapter.nombre][movedItem.descripcion];
            delete newTotals[sourceChapter.nombre][movedItem.descripcion];
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
        
        await updateItem('ia_budgets', { id: budgetId, breakdown: newBreakdown, userLineTotals: newTotals }, false);
        setRefreshTrigger(prev => prev + 1); // Refresh local state
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
                handleClientCategoriesChange,
                handleCreateBudgetFromAi,
                handleCreateSummaryBudgetFromAi,
                handleLoadForms,
                handleMoveFormContact,
                handleDiskUpload,
                handleDiskCreateFolder,
                handleDiskDeleteItem,
                fetchDiskItems,
                handleMoveAiPartida,
                handleMergeAiChapters,
                handleDeleteAiPartida,
              }}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
