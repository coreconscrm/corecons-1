
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderListCard } from "../tasks-card";
import { CollaboratorsListCard, type Collaborator } from "../collaborators-card";
import { InterioristasListCard, type Interiorista } from "../interioristas-card";
import { ConstructorasListCard, type Constructora } from "../constructoras-card";
import { ReformistasListCard, type Reformista } from "../reformistas-card";
import { InmobiliariasListCard, type Inmobiliaria } from "../inmobiliarias-card";
import { PriceListCard } from "../prices-card";

type Provider = { id: string; name: string; priceList?: any[] };

export function ProviderSection({
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator,
    interioristas, onAddInteriorista, onUpdateInteriorista, onDeleteInteriorista,
    constructoras, onAddConstructora, onUpdateConstructora, onDeleteConstructora,
    reformistas, onAddReformista, onUpdateReformista, onDeleteReformista,
    inmobiliarias, onAddInmobiliaria, onUpdateInmobiliaria, onDeleteInmobiliaria,
    visibleTabs
}: {
    providers: Provider[], onAddProvider: (p: any) => void, onUpdateProvider: (p: any) => void, onDeleteProvider: (id: string) => void,
    collaborators: Collaborator[], onAddCollaborator: (c: any) => void, onUpdateCollaborator: (c: any) => void, onDeleteCollaborator: (id: string) => void,
    interioristas: Interiorista[], onAddInteriorista: (c: any) => void, onUpdateInteriorista: (c: any) => void, onDeleteInteriorista: (id: string) => void,
    constructoras: Constructora[], onAddConstructora: (c: any) => void, onUpdateConstructora: (c: any) => void, onDeleteConstructora: (id: string) => void,
    reformistas: Reformista[], onAddReformista: (c: any) => void, onUpdateReformista: (c: any) => void, onDeleteReformista: (id: string) => void,
    inmobiliarias: Inmobiliaria[], onAddInmobiliaria: (c: any) => void, onUpdateInmobiliaria: (c: any) => void, onDeleteInmobiliaria: (id: string) => void,
    visibleTabs: any
}) {
     const tabs = [
        { value: "providers", label: "Proveedores", visible: visibleTabs.providers },
        { value: "collaborators", label: "Arquitectos", visible: visibleTabs.collaborators },
        { value: "interioristas", label: "Interioristas", visible: visibleTabs.interioristas },
        { value: "constructoras", label: "Constructoras", visible: visibleTabs.constructoras },
        { value: "reformistas", label: "Reformistas", visible: visibleTabs.reformistas },
        { value: "inmobiliarias", label: "Inmobiliarias", visible: visibleTabs.inmobiliarias },
        { value: "prices", label: "Base de Precios", visible: visibleTabs.prices },
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        const savedTab = localStorage.getItem('providerSection_activeTab');
        if (savedTab && tabs.some(t => t.value === savedTab)) {
            setActiveTab(savedTab);
        } else if (tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [visibleTabs, tabs]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('providerSection_activeTab', value);
    };
    
    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)` }}>
                {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
            </TabsList>
            {visibleTabs.providers && (
              <TabsContent value="providers" className="mt-6">
                  <ProviderListCard 
                      providers={providers}
                      onAddProvider={onAddProvider}
                      onUpdateProvider={onUpdateProvider}
                      onDeleteProvider={onDeleteProvider}
                  />
              </TabsContent>
            )}
            {visibleTabs.collaborators && (
              <TabsContent value="collaborators" className="mt-6">
                  <CollaboratorsListCard 
                      collaborators={collaborators}
                      onAddCollaborator={onAddCollaborator}
                      onUpdateCollaborator={onUpdateCollaborator}
                      onDeleteCollaborator={onDeleteCollaborator}
                  />
              </TabsContent>
            )}
            {visibleTabs.interioristas && (
              <TabsContent value="interioristas" className="mt-6">
                  <InterioristasListCard 
                      interioristas={interioristas}
                      onAddInteriorista={onAddInteriorista}
                      onUpdateInteriorista={onUpdateInteriorista}
                      onDeleteInteriorista={onDeleteInteriorista}
                  />
              </TabsContent>
            )}
             {visibleTabs.constructoras && (
              <TabsContent value="constructoras" className="mt-6">
                  <ConstructorasListCard 
                      constructoras={constructoras}
                      onAddConstructora={onAddConstructora}
                      onUpdateConstructora={onUpdateConstructora}
                      onDeleteConstructora={onDeleteConstructora}
                  />
              </TabsContent>
            )}
             {visibleTabs.reformistas && (
              <TabsContent value="reformistas" className="mt-6">
                  <ReformistasListCard 
                      reformistas={reformistas}
                      onAddReformista={onAddReformista}
                      onUpdateReformista={onUpdateReformista}
                      onDeleteReformista={onDeleteReformista}
                  />
              </TabsContent>
            )}
            {visibleTabs.inmobiliarias && (
              <TabsContent value="inmobiliarias" className="mt-6">
                  <InmobiliariasListCard 
                      inmobiliarias={inmobiliarias}
                      onAddInmobiliaria={onAddInmobiliaria}
                      onUpdateInmobiliaria={onUpdateInmobiliaria}
                      onDeleteInmobiliaria={onDeleteInmobiliaria}
                  />
              </TabsContent>
            )}
            {visibleTabs.prices && (
              <TabsContent value="prices" className="mt-6">
                  <PriceListCard providers={providers} />
              </TabsContent>
            )}
        </Tabs>
    )
}
