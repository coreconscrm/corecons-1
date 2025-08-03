
"use client";

import { useState, useEffect } from "react";
import { ProviderListCard } from "../tasks-card";
import { CollaboratorsListCard, type Collaborator } from "../collaborators-card";
import { InterioristasListCard, type Interiorista } from "../interioristas-card";
import { ConstructorasListCard, type Constructora } from "../constructoras-card";
import { ReformistasListCard, type Reformista } from "../reformistas-card";
import { InmobiliariasListCard, type Inmobiliaria } from "../inmobiliarias-card";
import { PriceListCard } from "../prices-card";
import { Button } from "@/components/ui/button";

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
        <div className="w-full space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
            
            <div className="mt-6">
                {activeTab === 'providers' && visibleTabs.providers && (
                    <ProviderListCard 
                        providers={providers}
                        onAddProvider={onAddProvider}
                        onUpdateProvider={onUpdateProvider}
                        onDeleteProvider={onDeleteProvider}
                    />
                )}
                {activeTab === 'collaborators' && visibleTabs.collaborators && (
                    <CollaboratorsListCard 
                        collaborators={collaborators}
                        onAddCollaborator={onAddCollaborator}
                        onUpdateCollaborator={onUpdateCollaborator}
                        onDeleteCollaborator={onDeleteCollaborator}
                    />
                )}
                {activeTab === 'interioristas' && visibleTabs.interioristas && (
                    <InterioristasListCard 
                        interioristas={interioristas}
                        onAddInteriorista={onAddInteriorista}
                        onUpdateInteriorista={onUpdateInteriorista}
                        onDeleteInteriorista={onDeleteInteriorista}
                    />
                )}
                {activeTab === 'constructoras' && visibleTabs.constructoras && (
                    <ConstructorasListCard 
                        constructoras={constructoras}
                        onAddConstructora={onAddConstructora}
                        onUpdateConstructora={onUpdateConstructora}
                        onDeleteConstructora={onDeleteConstructora}
                    />
                )}
                {activeTab === 'reformistas' && visibleTabs.reformistas && (
                     <ReformistasListCard 
                        reformistas={reformistas}
                        onAddReformista={onAddReformista}
                        onUpdateReformista={onUpdateReformista}
                        onDeleteReformista={onDeleteReformista}
                    />
                )}
                {activeTab === 'inmobiliarias' && visibleTabs.inmobiliarias && (
                    <InmobiliariasListCard 
                        inmobiliarias={inmobiliarias}
                        onAddInmobiliaria={onAddInmobiliaria}
                        onUpdateInmobiliaria={onUpdateInmobiliaria}
                        onDeleteInmobiliaria={onDeleteInmobiliaria}
                    />
                )}
                {activeTab === 'prices' && visibleTabs.prices && (
                    <PriceListCard providers={providers} />
                )}
            </div>
        </div>
    )
}
