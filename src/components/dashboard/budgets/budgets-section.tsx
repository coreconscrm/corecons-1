
"use client";

import { useState, useEffect, useMemo } from "react";
import { BudgetListCard, type Budget, type BudgetCategory } from '../budgets-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company } from "../company-card";

const budgetCategories: { value: BudgetCategory, label: string }[] = [
    { value: 'enviados', label: 'Enviados' },
    { value: 'obra_nueva', label: 'Obra Nueva' },
    { value: 'reformas', label: 'Reformas' },
    { value: 'subcontratas', label: 'Subcontratas' },
];

export { type Budget, type BudgetCategory };

export function BudgetSection({ budgets, clients, companies, onAddBudget, onUpdateBudget, onDeleteBudget }: { budgets: Budget[], clients: any[], companies: Company[], onAddBudget: (b: any) => void, onUpdateBudget: (b: any) => void, onDeleteBudget: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<BudgetCategory>('enviados');
  
  useEffect(() => {
    const savedTab = localStorage.getItem('budgetsSection_activeTab');
    if (savedTab && budgetCategories.some(c => c.value === savedTab)) {
        setActiveTab(savedTab as BudgetCategory);
    }
  }, []);

  const handleTabChange = (value: string) => {
    const tabValue = value as BudgetCategory;
    setActiveTab(tabValue);
    localStorage.setItem('budgetsSection_activeTab', tabValue);
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => (b.category || 'enviados') === activeTab);
  }, [budgets, activeTab]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {budgetCategories.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {budgetCategories.map(tab => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          <BudgetListCard
            title={`Presupuestos de ${tab.label}`}
            budgets={activeTab === tab.value ? filteredBudgets : []}
            clients={clients}
            companies={companies}
            onAddBudget={onAddBudget}
            onUpdateBudget={onUpdateBudget}
            onDeleteBudget={onDeleteBudget}
            activeCategory={tab.value as BudgetCategory}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
