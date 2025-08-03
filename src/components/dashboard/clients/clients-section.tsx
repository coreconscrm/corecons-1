
"use client";

import { useState, useEffect } from "react";
import { ClientListCard } from "../active-courses-card";
import { ReformaListCard } from "../reformas-card";
import type { BudgetCategory } from "../budgets/budgets-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader } from "@/components/ui/card";

export function ClientsSection({
    clients, providers, onAddClient, onUpdateClient, onDeleteClient, onCreateBudgetFromClient, onCreateSeguimientoFromClient,
    reformas, onAddReforma, onUpdateReforma, onDeleteReforma,
    visibleTabs, clientCategories, onClientCategoriesChange
}: {
    clients: any[], providers: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: any) => void, onCreateBudgetFromClient: (client: any, category: BudgetCategory) => void, onCreateSeguimientoFromClient: (client: any) => void,
    reformas: any[], onAddReforma: (reforma: any) => void, onUpdateReforma: (reforma: any) => void, onDeleteReforma: (id: any) => void,
    visibleTabs: any, clientCategories: string[], onClientCategoriesChange: (categories: string[]) => void,
}) {
    const { toast } = useToast();
    const [newCategory, setNewCategory] = useState("");
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

    const handleAddCategory = () => {
        if (newCategory && !clientCategories.includes(newCategory)) {
            onClientCategoriesChange([...clientCategories, newCategory]);
            setNewCategory("");
            toast({ title: `Subsección "${newCategory}" creada` });
        }
    };

    return (
         <div className="w-full space-y-6">
            <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)`}}>
                {tabs.map(tab => (
                    <Button
                        key={tab.value}
                        variant={activeTab === tab.value ? "default" : "outline"}
                        onClick={() => handleTabChange(tab.value)}
                        className="w-full"
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                         <div className="flex-grow">
                            <h3 className="text-lg font-semibold">Subsecciones de Clientes</h3>
                            <p className="text-sm text-muted-foreground">Crea y gestiona las categorías para organizar a tus clientes.</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Nueva subsección..." 
                                value={newCategory} 
                                onChange={(e) => setNewCategory(e.target.value)} 
                                className="h-9"
                            />
                            <Button size="sm" onClick={handleAddCategory}><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="mt-6">
                {activeTab === 'obra-nueva' && visibleTabs.clients && (
                    <ClientListCard 
                        clients={clients} 
                        providers={providers} 
                        onAddClient={onAddClient} 
                        onUpdateClient={onUpdateClient} 
                        onDeleteClient={onDeleteClient} 
                        onCreateBudgetFromClient={onCreateBudgetFromClient}
                        onCreateSeguimientoFromClient={onCreateSeguimientoFromClient}
                        categories={clientCategories}
                    />
                )}
                {activeTab === 'reformas' && visibleTabs.reformas && (
                    <ReformaListCard 
                        reformas={reformas} 
                        providers={providers} 
                        onAddReforma={onAddReforma} 
                        onUpdateReforma={onUpdateReforma} 
                        onDeleteReforma={onDeleteReforma}
                        onCreateBudgetFromClient={onCreateBudgetFromClient}
                        onCreateSeguimientoFromClient={onCreateSeguimientoFromClient}
                        categories={clientCategories}
                    />
                )}
            </div>
        </div>
    );
}
    
