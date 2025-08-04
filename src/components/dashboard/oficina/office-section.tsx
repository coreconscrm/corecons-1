
"use client";

import { useState, useEffect } from "react";
import { JuanfranNotesCard, type JuanFranNote } from "../juanfran-notes-card";
import { SandraNotesCard, type SandraNote } from "../sandra-notes-card";
import { JordanSectionCard, type JordanItem } from "../jordan-checklist-card";
import { DaniPrioritiesCard, type DaniPriority } from "../dani-priorities-card";
import { APresentarCard, type APresentarItem } from "../a-presentar-card";
import { ChatSection } from "../chat-section";
import { JulianNotesCard, type JulianNote } from "../julian-notes-card";
import { BookUser, MessageSquare, ListChecks, Presentation, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


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
    aPresentar,
    onAddPresentar,
    onUpdatePresentar,
    onDeletePresentar,
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
    aPresentar: APresentarItem[];
    onAddPresentar: (p: any) => Promise<void>;
    onUpdatePresentar: (p: any) => Promise<void>;
    onDeletePresentar: (id: string) => Promise<void>;
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
    const [activeTab, setActiveTab] = useState('dani');
    const { toast } = useToast();
    
    const tabs = [
        { value: "juanfran", label: "Apuntes de Juanfran", icon: ListChecks },
        { value: "julian", label: "Apuntes de Julian", icon: ListChecks },
        { value: "sandra", label: "Apuntes de Sandra", icon: BookUser },
        { value: "jordan", label: "CheckList de Jordan", icon: ListChecks },
        { value: "dani", label: "Prioridades para Dani", icon: BookUser },
        { value: "presentar", label: "A Presentar", icon: Presentation },
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

    const handlePassChecklist = (
        sourceItem: JuanFranNote | JordanItem | SandraNote | JulianNote,
        sourceType: 'juanfran' | 'jordan' | 'sandra' | 'julian',
        targetUserId: string,
        annotations: string
    ) => {
        const targetUser = team.find(t => t.id === targetUserId);
        if (!targetUser) {
            toast({ variant: "destructive", title: "Error", description: "No se encontró al miembro del equipo de destino." });
            return;
        }

        const sourceUser = team.find(t => t.name.toLowerCase().startsWith(sourceType));
        const sourceUserName = sourceUser ? sourceUser.name : sourceType.charAt(0).toUpperCase() + sourceType.slice(1);

        const checklistContent = (sourceItem.items || [])
            .map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`)
            .join('\n');

        const newItemContent = `
Checklist pasada desde ${sourceUserName}:
${checklistContent}

---
**Anotaciones de ${sourceUserName}:**
${annotations}
        `.trim();

        const newItem = {
            title: `(Pasado) ${sourceItem.title}`,
            content: newItemContent,
            type: 'note', // Passed checklists become notes
            date: new Date(),
            completed: false,
        };

        // Determine which "add" function to call based on the target user's name
        const targetUserName = targetUser.name.toLowerCase();
        if (targetUserName.startsWith('juanfran')) {
            onAddJuanfranNote(newItem);
        } else if (targetUserName.startsWith('sandra')) {
            onAddSandraNote(newItem);
        } else if (targetUserName.startsWith('jordan')) {
            onAddJordanChecklist(newItem);
        } else if (targetUserName.startsWith('julian')) {
            onAddJulianNote(newItem);
        } else {
             // Fallback or handle other users if necessary
             toast({ variant: "destructive", title: "Error", description: `No se encontró una sección de notas para ${targetUser.name}.` });
             return;
        }
        
        // Delete original item
        switch(sourceType) {
            case 'juanfran': onDeleteJuanfranNote(sourceItem.id); break;
            case 'jordan': onDeleteJordanChecklist(sourceItem.id); break;
            case 'sandra': onDeleteSandraNote(sourceItem.id); break;
            case 'julian': onDeleteJulianNote(sourceItem.id); break;
        }

        toast({ title: "Checklist Pasada", description: `La checklist "${sourceItem.title}" ha sido pasada a ${targetUser.name}.` });
    };


    return (
        <div className="w-full space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
                        team={team}
                        onPassChecklist={(item, target, notes) => handlePassChecklist(item, 'juanfran', target, notes)}
                    />
                )}
                {activeTab === 'julian' && (
                     <JulianNotesCard
                        notes={julianNotes}
                        onAddJulianNote={onAddJulianNote}
                        onUpdateJulianNote={onUpdateJulianNote}
                        onDeleteJulianNote={onDeleteJulianNote}
                        team={team}
                        onPassChecklist={(item, target, notes) => handlePassChecklist(item, 'julian', target, notes)}
                    />
                )}
                {activeTab === 'sandra' && (
                     <SandraNotesCard
                        notes={sandraNotes}
                        onAddNote={onAddSandraNote}
                        onUpdateNote={onUpdateSandraNote}
                        onDeleteNote={onDeleteSandraNote}
                        team={team}
                        onPassChecklist={(item, target, notes) => handlePassChecklist(item, 'sandra', target, notes)}
                    />
                )}
                {activeTab === 'jordan' && (
                    <JordanSectionCard
                        items={jordanChecklists}
                        onAddItem={onAddJordanChecklist}
                        onUpdateItem={onUpdateJordanChecklist}
                        onDeleteItem={onDeleteJordanChecklist}
                        team={team}
                        onPassChecklist={(item, target, notes) => handlePassChecklist(item, 'jordan', target, notes)}
                    />
                )}
                {activeTab === 'dani' && (
                    <DaniPrioritiesCard
                        priorities={daniPriorities}
                        onAddPriority={onAddDaniPriority}
                        onUpdatePriority={onUpdateDaniPriority}
                        onDeletePriority={onDeleteDaniPriority}
                    />
                )}
                {activeTab === 'presentar' && (
                    <APresentarCard
                        items={aPresentar}
                        onAddItem={onAddPresentar}
                        onUpdateItem={onUpdatePresentar}
                        onDeleteItem={onDeletePresentar}
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
