
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientListCard } from "../active-courses-card";
import { ReformaListCard } from "../reformas-card";
import type { BudgetCategory } from "../budgets/budgets-section";

export function ClientsSection({
    clients, providers, onAddClient, onUpdateClient, onDeleteClient, onCreateBudgetFromClient, onCreateSeguimientoFromClient,
    reformas, onAddReforma, onUpdateReforma, onDeleteReforma,
    visibleTabs
}: {
    clients: any[], providers: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void, onCreateBudgetFromClient: (client: any, category: BudgetCategory) => void, onCreateSeguimientoFromClient: (client: any) => void,
    reformas: any[], onAddReforma: (reforma: any) => void, onUpdateReforma: (reforma: any) => void, onDeleteReforma: (id: any) => void,
    visibleTabs: any
}) {
    const tabs = [
        { value: "obra-nueva", label: "Obra Nueva", visible: visibleTabs.clients },
        { value: "reformas", label: "Reformas", visible: visibleTabs.reformas },
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        const savedTab = localStorage.getItem('clientsSection_activeTab');
        if (savedTab && tabs.some(t => t.value === savedTab)) {
            setActiveTab(savedTab);
        } else if (tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [visibleTabs, tabs]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('clientsSection_activeTab', value);
    };


    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)`}}>
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>

            {visibleTabs.clients && (
                <TabsContent value="obra-nueva" className="mt-6">
                    <ClientListCard 
                        clients={clients} 
                        providers={providers} 
                        onAddClient={onAddClient} 
                        onUpdateClient={onUpdateClient} 
                        onDeleteClient={onDeleteClient} 
                        onCreateBudgetFromClient={onCreateBudgetFromClient}
                        onCreateSeguimientoFromClient={onCreateSeguimientoFromClient}
                    />
                </TabsContent>
            )}

            {visibleTabs.reformas && (
                <TabsContent value="reformas" className="mt-6">
                    <ReformaListCard 
                        reformas={reformas} 
                        providers={providers} 
                        onAddReforma={onAddReforma} 
                        onUpdateReforma={onUpdateReforma} 
                        onDeleteReforma={onDeleteReforma}
                        onCreateBudgetFromClient={onCreateBudgetFromClient}
                        onCreateSeguimientoFromClient={onCreateSeguimientoFromClient}
                    />
                </TabsContent>
            )}
        </Tabs>
    );
}
