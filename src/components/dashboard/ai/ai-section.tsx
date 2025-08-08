

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { createProjectBreakdown, type ProjectBreakdown } from "@/ai/flows/create-project-breakdown";
import { createFormsReport, type FormsReport } from '@/ai/flows/create-forms-report';
import type { Company } from "../company/company-section";
import type { BudgetCategory } from "../budgets/budgets-section";
import { BudgetUploader, AiBudgetsSection, type AiBudgetItem } from './budget-components';
import { AiReportGenerator, AiReportViewer } from './report-components';
import { BrainCircuit } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";


export { type AiBudgetItem };

// --- Sección Principal de IA ---
export function AiSection({
    companies,
    forms,
    aiBudgets,
    onAddAiBudget,
    onUpdateAiBudget,
    onDeleteAiBudget,
    onCreateBudgetFromAi,
    onCreateSummaryBudgetFromAi,
    onMoveAiPartida,
    onMergeAiChapters,
    onDeleteAiPartida,
}: {
    companies: Company[],
    forms: any[],
    aiBudgets: AiBudgetItem[],
    onAddAiBudget: (budget: any) => void;
    onUpdateAiBudget: (budget: any, refresh?: boolean) => void;
    onDeleteAiBudget: (id: string) => void;
    onCreateBudgetFromAi: (aiBudget: AiBudgetItem, category: BudgetCategory) => void;
    onCreateSummaryBudgetFromAi: (aiBudget: AiBudgetItem) => void;
    onMoveAiPartida: (budgetId: string, source: any, destination: any) => void;
    onMergeAiChapters: (budgetId: string, sourceChapterName: string, targetChapterName: string) => void;
    onDeleteAiPartida: (budgetId: string, chapterName: string, partidaIndex: number) => void;
}) {
    const { toast } = useToast();
    const [latestReport, setLatestReport] = useState<FormsReport | null>(null);
    const [activeTab, setActiveTab] = useState('budgets');
    const [subTab, setSubTab] = useState('upload');
    const [reportsSubTab, setReportsSubTab] = useState('generator');
    
    useEffect(() => {
        const savedTab = localStorage.getItem('aiSection_activeTab');
        const savedSubTab = localStorage.getItem('aiSection_subTab');
        const savedReportsSubTab = localStorage.getItem('aiSection_reportsSubTab');

        if (savedTab) setActiveTab(savedTab);
        if (savedSubTab) setSubTab(savedSubTab);
        if (savedReportsSubTab) setReportsSubTab(savedReportsSubTab);
    }, []);

    const handleTabChange = (value: string, type: 'main' | 'sub' | 'reports') => {
        switch (type) {
            case 'main':
                setActiveTab(value);
                localStorage.setItem('aiSection_activeTab', value);
                break;
            case 'sub':
                setSubTab(value);
                localStorage.setItem('aiSection_subTab', value);
                break;
            case 'reports':
                setReportsSubTab(value);
                localStorage.setItem('aiSection_reportsSubTab', value);
                break;
        }
    };

    const handleSaveToAiBudgets = useCallback(async (breakdown: ProjectBreakdown, fileName: string) => {
        try {
            const newBudget = {
                fileName: fileName,
                title: fileName,
                createdAt: new Date(),
                breakdown: JSON.parse(JSON.stringify(breakdown)), // Deep copy to prevent issues
                userLineTotals: {},
                clientName: "",
                description: ""
            };
            onAddAiBudget(newBudget);
            toast({ title: "Presupuesto Guardado", description: "El desglose ha sido guardado en la sección de Presupuestos IA." });
        } catch (error) {
            console.error("Error saving AI budget:", error);
            toast({ variant: "destructive", title: "Error al guardar", description: `No se pudo guardar el presupuesto. ${(error as Error).message}` });
            throw error; // Propagate error
        }
    }, [toast, onAddAiBudget]);

     const handleGenerateReport = async () => {
        if (forms.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos', description: 'Carga datos de formularios (CSV o Google Sheet) antes de generar un reporte.' });
            return;
        }

        try {
            const formsJson = JSON.stringify(forms);
            const report = await createFormsReport({ formsJson });
            
            const reportRef = doc(db, 'ia_reports', 'latest');
            await setDoc(reportRef, { ...report, generatedAt: new Date() });

            setLatestReport(report);
            toast({ title: 'Reporte Generado y Guardado', description: 'El reporte de prioridad ha sido creado y guardado en la base de datos.' });
        } catch (error) {
            console.error("Error generating forms report:", error);
            toast({ variant: 'destructive', title: 'Error de IA', description: `No se pudo generar el reporte. ${(error as Error).message}` });
        }
    };
    
    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button variant={activeTab === 'budgets' ? 'default' : 'outline'} onClick={() => handleTabChange('budgets', 'main')} className="w-full">
                    <BrainCircuit className="mr-2" />Presupuestos y Precios
                </Button>
                <Button variant={activeTab === 'reports' ? 'default' : 'outline'} onClick={() => handleTabChange('reports', 'main')} className="w-full">
                    <BrainCircuit className="mr-2" />Reportes de Formularios
                </Button>
            </div>
            
            <div className="mt-6">
                {activeTab === 'budgets' && (
                    <div className="w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             <Button variant={subTab === 'upload' ? 'default' : 'outline'} onClick={() => handleTabChange('upload', 'sub')} className="w-full">
                                Subir para Presupuestos IA
                            </Button>
                            <Button variant={subTab === 'view-and-edit' ? 'default' : 'outline'} onClick={() => handleTabChange('view-and-edit', 'sub')} className="w-full">
                                Presupuestos IA
                            </Button>
                        </div>
                        
                        {subTab === 'upload' && (
                             <BudgetUploader 
                                onAnalysisComplete={handleSaveToAiBudgets}
                            />
                        )}
                         {subTab === 'view-and-edit' && (
                            <AiBudgetsSection 
                                aiBudgets={aiBudgets}
                                onUpdateAiBudget={onUpdateAiBudget}
                                onDeleteAiBudget={onDeleteAiBudget}
                                companies={companies} 
                                onCreateBudgetFromAi={onCreateBudgetFromAi}
                                onCreateSummaryBudgetFromAi={onCreateSummaryBudgetFromAi}
                                onMovePartida={onMoveAiPartida}
                                onMergeChapters={onMergeAiChapters}
                                onDeletePartida={onDeleteAiPartida}
                            />
                         )}
                    </div>
                )}
                 {activeTab === 'reports' && (
                    <div className="w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Button variant={reportsSubTab === 'generator' ? 'default' : 'outline'} onClick={() => handleTabChange('generator', 'reports')} className="w-full">
                                Generador de Reportes
                            </Button>
                             <Button variant={reportsSubTab === 'viewer' ? 'default' : 'outline'} onClick={() => handleTabChange('viewer', 'reports')} className="w-full">
                                Visor de Reporte IA
                            </Button>
                        </div>
                        
                        {reportsSubTab === 'generator' && (
                            <AiReportGenerator forms={forms} onGenerateReport={handleGenerateReport} />
                        )}
                        {reportsSubTab === 'viewer' && (
                            <AiReportViewer latestReport={latestReport} />
                        )}
                    </div>
                 )}
            </div>
        </div>
    );
}
