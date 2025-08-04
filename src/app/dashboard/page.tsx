
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
};

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
    seguimientoEstadoOptions: ['buscar terreno', 'esperando'],
    seguimientoPorHacerOptions: ['llamar', 'buscar arquitecto'],
    seguimientoCategories: ['General'],
    clientCategories: ['En Contacto', 'Ayudando', 'Presupuestando', 'Firmado', 'Construyendo', 'Finalizado'],
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
    seguimientoCategories: ['General'],
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

        return [...folders, ...files];
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
    fetchAllDiskItems();

    const unsubscribes = Object.entries(collectionStateMap).map(([collectionName, stateKey]) => {
      let q;
      if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy("date", "desc"));
      } else if (collectionName === 'seguimientos') {
         q = query(collection(db, collectionName)); // Sorting is handled client-side
      } else if (['contacts', 'priority_calls'].includes(collectionName)) {
        q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      } else if (collectionName === 'forms') {
        q = query(collection(db, collectionName), orderBy(documentId())); // Order by document ID for consistency
      }
      else {
        q = query(collection(db, collectionName));
      }
      
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData((prevData:any) => ({ ...prevData, [stateKey]: items }));
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

    // Fetch Client categories
    const clientCategoriesDocRef = doc(db, 'config', 'clientCategories');
    const unsubClientCategories = onSnapshot(clientCategoriesDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setData(prev => ({...prev, clientCategories: data.categories || ['En Contacto', 'Ayudando', 'Presupuestando', 'Firmado', 'Construyendo', 'Finalizado']}));
        }
    });
    
    // Fetch Google Sheet URL
    const sheetConfigDocRef = doc(db, 'config', 'googleSheet');
    const unsubSheetUrl = onSnapshot(sheetConfigDocRef, (doc) => {
      setData((prev: any) => ({ ...prev, sheetUrl: doc.exists() ? doc.data().url : '' }));
    });
    
    // Fetch Column Configurations
    ['forms', 'contacts', 'priority_calls'].forEach(type => {
        const configDocRef = doc(db, 'config', `${type}Columns`);
        onSnapshot(configDocRef, (docSnap) => {
            const key = type === 'forms' ? 'formCols' : (type === 'priority_calls' ? 'priorityCols' : 'contactCols');
            const dataKey = type === 'priority_calls' ? 'priorityCalls' : type;

            if (docSnap.exists()) {
                 setData(prev => ({ ...prev, [key]: docSnap.data().columns }));
            } else {
                 setData(prev => {
                    const currentItems = prev[dataKey as keyof typeof prev];
                    if (Array.isArray(currentItems) && currentItems.length > 0 && prev[key].length === 0) {
                        const firstItemKeys = Object.keys(currentItems[0]).filter(k => k !== 'id');
                        const newCols = firstItemKeys.map(k => ({
                            key: k,
                            visible: true,
                            displayName: getDisplayName(k)
                        }));
                        return { ...prev, [key]: newCols };
                    }
                    return prev;
                });
            }
        });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      unsubSettings();
      unsubSegOptions();
      unsubClientCategories();
      unsubSheetUrl();
    };
  }, [fetchAllDiskItems]);

  const handleLoadForms = useCallback(async (formData: any[]) => {
      if (!formData || formData.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se encontraron datos para cargar.' });
          return;
      }
      
      const formsCollectionRef = collection(db, "forms");
      const batch = writeBatch(db);
      
      const existingFormsSnapshot = await getDocs(formsCollectionRef);
      // Clear existing forms
      existingFormsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
      });

      // Add new forms
      formData.forEach(newItem => {
          const docRef = doc(formsCollectionRef);
          batch.set(docRef, newItem);
      });

      await batch.commit();
      toast({ title: 'Datos actualizados', description: `Se han cargado ${formData.length} nuevos registros desde la hoja.` });
  }, [toast]);

  useEffect(() => {
    const fetchSheetData = () => {
      if (data.sheetUrl) {
        Papa.parse(data.sheetUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                handleLoadForms(results.data);
            },
            error: (err) => {
                toast({ variant: "destructive", title: "Error al leer Google Sheet", description: `No se pudo acceder a la URL. Verifica que esté publicada correctamente. Error: ${(err as Error).message}` });
            },
        });
      }
    };
    fetchSheetData();
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
  
  const handleClientCategoriesChange = async (categories: string[]) => {
        try {
            const docRef = doc(db, 'config', 'clientCategories');
            await setDoc(docRef, { categories }, { merge: true });
            toast({ title: "Subsecciones guardadas", description: "Las nuevas subsecciones se han guardado correctamente." });
        } catch (error) {
            console.error("Error saving client categories:", error);
            toast({ variant: "destructive", title: "Error al guardar subsecciones", description: (error as Error).message });
        }
    };

  const createItem = useCallback(async (collectionName: string, itemData: any) => {
    const dataToSave = { ...itemData };
    if (['chat_messages', 'dani_priorities', 'sandra_notes', 'juanfran_notes', 'julian_notes', 'jordan_checklists', 'a_presentar'].includes(collectionName)) {
        if (!dataToSave.date) {
            dataToSave.date = Timestamp.now();
        }
    }
    if (['contacts', 'priority_calls'].includes(collectionName)) {
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
  }, [toast]);
  
    const handleMoveFormContact = useCallback(async (formItem: any, destination: 'contacts' | 'priority_calls') => {
        const { id, ...data } = formItem;
        if (!id) {
            toast({ variant: 'destructive', title: 'Error', description: 'El elemento del formulario no tiene ID.' });
            return;
        }

        const batch = writeBatch(db);

        // Add to new collection
        const newDocRef = doc(collection(db, destination));
        batch.set(newDocRef, { ...data, createdAt: Timestamp.now() });

        // Delete from old collection
        const oldDocRef = doc(db, 'forms', id);
        batch.delete(oldDocRef);

        try {
            await batch.commit();
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
        await fetchAllDiskItems(); // Re-fetch to show new file
        toast({ title: 'Archivo Subido', description: `Se ha subido ${file.name}.` });
    }, [fetchAllDiskItems, toast]);

    const handleDiskCreateFolder = useCallback(async (path: string, folderName: string) => {
        const placeholderPath = `${path}${folderName}/.placeholder`;
        const placeholderRef = ref(storage, placeholderPath);
        await uploadBytes(placeholderRef, new Blob());
        await fetchAllDiskItems(); // Re-fetch to show new folder
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
    
    const handleDiskMoveItem = useCallback(async (sourcePath: string, destPath: string) => {
        const moveFile = async (sourceFileRef: any, destFolder: string) => {
            const destFileRef = ref(storage, `${destFolder}${sourceFileRef.name}`);
            const fileBytes = await getBytes(sourceFileRef);
            await uploadBytes(destFileRef, fileBytes);
            await deleteObject(sourceFileRef);
        };
    
        const moveFolder = async (sourceFolderPath: string, destFolderPath: string) => {
            const sourceFolderRef = ref(storage, sourceFolderPath);
            const listResult = await listAll(sourceFolderRef);
    
            // Move files
            for (const itemRef of listResult.items) {
                if (itemRef.name !== '.placeholder') {
                  await moveFile(itemRef, destFolderPath);
                }
            }
    
            // Move subfolders recursively
            for (const prefixRef of listResult.prefixes) {
                await moveFolder(prefixRef.fullPath, `${destFolderPath}${prefixRef.name}/`);
            }
            
            // Delete the source folder (and its placeholder) after moving everything
            await deleteFolderContents(sourceFolderPath);
        };
    
        try {
            const metadata = await getMetadata(ref(storage, sourcePath)).catch(() => null);
    
            if (metadata) { // It's a file
                const sourceFileRef = ref(storage, sourcePath);
                await moveFile(sourceFileRef, destPath);
            } else { // It's a folder
                const folderName = sourcePath.split('/').filter(Boolean).pop();
                if (folderName) {
                    const newDestPath = `${destPath}${folderName}/`;
                    await moveFolder(sourcePath, newDestPath);
                }
            }
    
            await fetchAllDiskItems();
            toast({ title: 'Elemento movido', description: 'El elemento se ha movido correctamente.' });
        } catch (error: any) {
            console.error("Error moving item:", error);
            toast({ variant: 'destructive', title: 'Error al mover', description: (error as Error).message });
        }
    }, [fetchAllDiskItems, toast]);

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
  
  const aPresentarHoy = data.aPresentar.filter((p: any) => {
    if (!p.presentationDate || !p.presentationDate.toDate) return false;
    return isToday(p.presentationDate.toDate());
  }).length;
  
  const seguimientoMetrics = data.seguimientoCategories.reduce((acc: any, category: string) => {
      acc[category] = data.seguimientos.filter((s: any) => s.category === category).length;
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
                handleDiskMoveItem,
                fetchDiskItems
              }}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
