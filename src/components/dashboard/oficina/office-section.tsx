
"use client";

import { useState, useEffect } from "react";
import { JuanfranNotesCard, type JuanFranNote } from "../juanfran-notes-card";
import { SandraNotesCard, type SandraNote } from "../sandra-notes-card";
import { JordanSectionCard, type JordanItem } from "../jordan-checklist-card";
import { DaniPrioritiesCard, type DaniPriority } from "../dani-priorities-card";
import { ChatSection } from "../chat-section";
import { JulianNotesCard, type JulianNote } from "../julian-notes-card";
import { BookUser, MessageSquare, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";


export function OfficeSection({
    juanfranNotes,
    onAddJuanfranNote,
    onUpdateJuanfranNote,
    onDeleteJuanfranNote,
    sandraNotes,
    onAddSandraNote,
    onUpdateSandraNote,
    onDeleteSandraNote,
    jordanChecklists,
    onAddJordanChecklist,
    onUpdateJordanChecklist,
    onDeleteJordanChecklist,
    daniPriorities,
    onAddDaniPriority,
    onUpdateDaniPriority,
    onDeleteDaniPriority,
    onAddPresentar,
    chatMessages,
    team,
    onAddChatMessage,
    onUpdateChatMessage,
    onDeleteChatMessage,
    julianNotes,
    onAddJulianNote,
    onUpdateJulianNote,
    onDeleteJulianNote,
}: {
    juanfranNotes: JuanFranNote[];
    onAddJuanfranNote: (note: any) => void;
    onUpdateJuanfranNote: (note: any) => void;
    onDeleteJuanfranNote: (id: string) => void;
    sandraNotes: SandraNote[];
    onAddSandraNote: (note: any) => void;
    onUpdateSandraNote: (note: any) => void;
    onDeleteSandraNote: (id: string) => void;
    jordanChecklists: JordanItem[];
    onAddJordanChecklist: (c: any) => void;
    onUpdateJordanChecklist: (c: any) => void;
    onDeleteJordanChecklist: (id: string) => void;
    daniPriorities: DaniPriority[];
    onAddDaniPriority: (p: any) => void;
    onUpdateDaniPriority: (p: any) => void;
    onDeleteDaniPriority: (id: string) => void;
    onAddPresentar: (p: any) => void;
    chatMessages: any[];
    team: any[];
    onAddChatMessage: (message: any) => void;
    onUpdateChatMessage: (message: any) => void;
    onDeleteChatMessage: (id: string) => void;
    julianNotes: JulianNote[];
    onAddJulianNote: (note: any) => void;
    onUpdateJulianNote: (note: any) => void;
    onDeleteJulianNote: (id: string) => void;
}) {
    const [activeTab, setActiveTab] = useState('juanfran');
    
    const tabs = [
        { value: "juanfran", label: "Apuntes de Juanfran", icon: ListChecks },
        { value: "julian", label: "Apuntes de Julian", icon: ListChecks },
        { value: "sandra", label: "Apuntes de Sandra", icon: BookUser },
        { value: "jordan", label: "CheckList de Jordan", icon: ListChecks },
        { value: "dani", label: "Prioridades para Dani", icon: BookUser },
        { value: "chat", label: "Chat", icon: MessageSquare },
    ];

    useEffect(() => {
        const savedTab = localStorage.getItem('officeSection_activeTab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('officeSection_activeTab', value);
    };

    return (
        <div className="w-full space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {tabs.map(tab => (
                    <Button
                        key={tab.value}
                        variant={activeTab === tab.value ? "default" : "outline"}
                        onClick={() => handleTabChange(tab.value)}
                        className="w-full flex-col h-16 sm:h-20 sm:flex-row sm:justify-center"
                    >
                        <tab.icon className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />
                        <span className="text-xs text-center sm:text-sm">{tab.label}</span>
                    </Button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === 'juanfran' && (
                    <JuanfranNotesCard
                        notes={juanfranNotes}
                        onAddJuanfranNote={onAddJuanfranNote}
                        onUpdateJuanfranNote={onUpdateJuanfranNote}
                        onDeleteJuanfranNote={onDeleteJuanfranNote}
                    />
                )}
                {activeTab === 'julian' && (
                     <JulianNotesCard
                        notes={julianNotes}
                        onAddJulianNote={onAddJulianNote}
                        onUpdateJulianNote={onUpdateJulianNote}
                        onDeleteJulianNote={onDeleteJulianNote}
                    />
                )}
                {activeTab === 'sandra' && (
                     <SandraNotesCard
                        notes={sandraNotes}
                        onAddNote={onAddSandraNote}
                        onUpdateNote={onUpdateSandraNote}
                        onDeleteNote={onDeleteSandraNote}
                    />
                )}
                {activeTab === 'jordan' && (
                    <JordanSectionCard
                        items={jordanChecklists}
                        onAddItem={onAddJordanChecklist}
                        onUpdateItem={onUpdateJordanChecklist}
                        onDeleteItem={onDeleteJordanChecklist}
                    />
                )}
                {activeTab === 'dani' && (
                    <DaniPrioritiesCard
                        priorities={daniPriorities}
                        onAddPriority={onAddDaniPriority}
                        onUpdatePriority={onUpdateDaniPriority}
                        onDeletePriority={onDeleteDaniPriority}
                        onAddPresentar={onAddPresentar}
                    />
                )}
                {activeTab === 'chat' && (
                     <ChatSection 
                        messages={chatMessages}
                        team={team}
                        onAddMessage={onAddChatMessage}
                        onUpdateMessage={onUpdateChatMessage}
                        onDeleteMessage={onDeleteChatMessage}
                    />
                )}
            </div>
        </div>
    );
}
