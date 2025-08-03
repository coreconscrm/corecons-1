
"use client";

import { useState, useEffect, useMemo } from "react";
import { BudgetListCard, type Budget, type BudgetCategory } from '../budgets-card';
import { Button } from "@/components/ui/button";

const budgetCategories: { value: BudgetCategory, label: string }[] = [
    { value: 'enviados', label: 'Enviados' },
    { value: 'obra_nueva', label: 'Obra Nueva' },
    { value: 'reformas', label: 'Reformas' },
    { value: 'subcontratas', label: 'Subcontratas' },
];

export { type Budget, type BudgetCategory };

export function BudgetSection({ budgets, clients, companies, onAddBudget, onUpdateBudget, onDeleteBudget }: { budgets: Budget[], clients: any[], companies: any[], onAddBudget: (b: any) => void, onUpdateBudget: (b: any) => void, onDeleteBudget: (id: string) => void }) {
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
    <div className="w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {budgetCategories.map(tab => (
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
        
        <div className="mt-6">
            <BudgetListCard
              title={`Presupuestos de ${budgetCategories.find(c => c.value === activeTab)?.label}`}
              budgets={filteredBudgets}
              clients={clients}
              companies={companies}
              onAddBudget={onAddBudget}
              onUpdateBudget={onUpdateBudget}
              onDeleteBudget={onDeleteBudget}
              activeCategory={activeTab}
            />
        </div>
    </div>
  )
}
