
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Header } from "@/components/dashboard/header";
import { DashboardTabs } from "@/components/dashboard/progress-metrics-card";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, StickyNote } from 'lucide-react';
import { NotepadSheet } from '@/components/dashboard/notepad-sheet';
import { Button } from "@/components/ui/button";
import { SeguimientoOverview, BudgetOverview, FormOverview, OficinaOverview } from "@/components/dashboard/welcome-banner";
import { isWithinInterval, parse, startOfWeek, endOfWeek, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [visibleTabs, setVisibleTabs] = useState(defaultVisibleTabs);
  const [activeTab, setActiveTab] = useState("oficina");
  const [isNotepadOpen, setNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const [showOverviewPanels, setShowOverviewPanels] = useState(false);

  // Overview states
  const [overviewData, setOverviewData] = useState({
      budgets: [],
      forms: [],
      contacts: [],
      priorityCalls: [],
      seguimientos: [],
      juanfranNotes: [],
      julianNotes: [],
      sandraNotes: [],
      jordanChecklists: [],
      daniPriorities: [],
      chatMessages: [],
  });

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
  
  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch dashboard settings (tab visibility, etc.)
            const settingsDocRef = doc(db, 'config', 'dashboardSettings');
            const settingsDocSnap = await getDoc(settingsDocRef);
            if (settingsDocSnap.exists()) {
                const settingsData = settingsDocSnap.data();
                if (settingsData.visibleTabs) {
                    setVisibleTabs(prev => ({ ...prev, ...settingsData.visibleTabs }));
                }
                 if (settingsData.showOverviewPanels) {
                    setShowOverviewPanels(settingsData.showOverviewPanels);
                }
            }
        } catch (error) {
            console.error("Error fetching initial settings:", error);
            toast({
                variant: "destructive",
                title: "Error al cargar la configuración",
                description: `No se pudo leer la configuración guardada. Error: ${(error as Error).message}`,
            });
        } finally {
            setIsLoading(false);
        }
  }, [toast]);
  
    fetchInitialData();
  }, [toast]);
  
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
      }
  };

  // Metrics for Budget Overview
  const budgetsPending = overviewData.budgets.filter((b:any) => b.status === 'Pendiente').length;
  const budgetsAccepted = overviewData.budgets.filter((b:any) => b.status === 'Aceptado').length;
  const budgetsRejected = overviewData.budgets.filter((b:any) => b.status === 'Rechazado').length;
  const budgetsDone = overviewData.budgets.filter((b:any) => b.status === 'Hechos').length;
  const budgetsSent = overviewData.budgets.filter((b:any) => b.status === 'Enviados').length;

  // Metrics for Form Overview
  const formsTotal = overviewData.forms.length;
  const manualAndPriorityTotal = overviewData.contacts.length + overviewData.priorityCalls.length;
  const manualAndPriorityCalled = overviewData.contacts.filter((c:any) => c.called).length + overviewData.priorityCalls.filter((pc:any) => pc.called).length;
  const manualAndPriorityPending = manualAndPriorityTotal - manualAndPriorityCalled;

  // Metrics for Seguimiento Overview
  const totalSeguimientos = overviewData.seguimientos.length;
  
  const llamarEstaSemana = overviewData.seguimientos.filter((s: any) => {
    if (!s.siguienteLlamada || typeof s.siguienteLlamada !== 'string') return false;
    const nextCallDate = parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date());
    if (!isValid(nextCallDate)) return false;
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { locale: es, weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { locale: es, weekStartsOn: 1 });
    return isWithinInterval(nextCallDate, { start: startOfThisWeek, end: endOfThisWeek });
  }).length;
  
  const ofrecerArquitecto = overviewData.seguimientos.filter((s:any) => s.porHacer?.toLowerCase().trim() === 'buscar arquitecto').length;
  const buscarTerreno = overviewData.seguimientos.filter((s:any) => s.estado?.toLowerCase().trim() === 'buscar terreno').length;

  // Metrics for Oficina Overview
  const countPending = (items: any[]) => {
    return items.filter(item => {
        if (item.type === 'checklist') {
            return !(item.items || []).every((subItem: any) => subItem.completed);
        }
        return !item.completed;
    }).length;
  };
  
  const juanfranPending = countPending(overviewData.juanfranNotes);
  const julianPending = countPending(overviewData.julianNotes);
  const sandraPending = overviewData.sandraNotes.filter((n:any) => !n.completed).length;
  const jordanPending = countPending(overviewData.jordanChecklists);
  const daniPending = overviewData.daniPriorities.filter((p:any) => !p.completed).length;
  const unreadChats = overviewData.chatMessages.filter((m:any) => !m.read).length;


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
              setOverviewData={setOverviewData}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
