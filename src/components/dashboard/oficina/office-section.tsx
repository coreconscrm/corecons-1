
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JuanfranNotesCard, type JuanFranNote } from "../juanfran-notes-card";
import { SandraNotesCard, type SandraNote } from "../sandra-notes-card";
import { JordanSectionCard, type JordanItem } from "../jordan-checklist-card";
import { DaniPrioritiesCard, type DaniPriority } from "../dani-priorities-card";
import { ChatSection } from "../chat-section";
import { JulianNotesCard, type JulianNote } from "../julian-notes-card";
import { BookUser, MessageSquare, ListChecks } from "lucide-react";


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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center">
                <TabsList className="h-auto flex-col md:flex-row items-center">
                    <TabsTrigger value="juanfran" className="text-xs px-2 py-1">
                        <ListChecks className="mr-2" />
                        Apuntes de Juanfran
                    </TabsTrigger>
                     <TabsTrigger value="julian" className="text-xs px-2 py-1">
                        <ListChecks className="mr-2" />
                        Apuntes de Julian
                    </TabsTrigger>
                    <TabsTrigger value="sandra" className="text-xs px-2 py-1">
                        <BookUser className="mr-2" />
                        Apuntes de Sandra
                    </TabsTrigger>
                    <TabsTrigger value="jordan" className="text-xs px-2 py-1">
                        <ListChecks className="mr-2" />
                        CheckList de Jordan
                    </TabsTrigger>
                    <TabsTrigger value="dani" className="text-xs px-2 py-1">
                        <BookUser className="mr-2" />
                        Prioridades para Dani
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="text-xs px-2 py-1">
                        <MessageSquare className="mr-2" />
                        Chat
                    </TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="juanfran" className="mt-6">
                 <JuanfranNotesCard
                    notes={juanfranNotes}
                    onAddJuanfranNote={onAddJuanfranNote}
                    onUpdateJuanfranNote={onUpdateJuanfranNote}
                    onDeleteJuanfranNote={onDeleteJuanfranNote}
                />
            </TabsContent>
            <TabsContent value="julian" className="mt-6">
                 <JulianNotesCard
                    notes={julianNotes}
                    onAddJulianNote={onAddJulianNote}
                    onUpdateJulianNote={onUpdateJulianNote}
                    onDeleteJulianNote={onDeleteJulianNote}
                />
            </TabsContent>
             <TabsContent value="sandra" className="mt-6">
                 <SandraNotesCard
                    notes={sandraNotes}
                    onAddNote={onAddSandraNote}
                    onUpdateNote={onUpdateSandraNote}
                    onDeleteNote={onDeleteSandraNote}
                />
            </TabsContent>
             <TabsContent value="jordan" className="mt-6">
                <JordanSectionCard
                    items={jordanChecklists}
                    onAddItem={onAddJordanChecklist}
                    onUpdateItem={onUpdateJordanChecklist}
                    onDeleteItem={onDeleteJordanChecklist}
                />
            </TabsContent>
            <TabsContent value="dani" className="mt-6">
                <DaniPrioritiesCard
                    priorities={daniPriorities}
                    onAddPriority={onAddDaniPriority}
                    onUpdatePriority={onUpdateDaniPriority}
                    onDeletePriority={onDeleteDaniPriority}
                    onAddPresentar={onAddPresentar}
                />
            </TabsContent>
            <TabsContent value="chat" className="mt-6">
                <ChatSection 
                    messages={chatMessages}
                    team={team}
                    onAddMessage={onAddChatMessage}
                    onUpdateMessage={onUpdateChatMessage}
                    onDeleteMessage={onDeleteChatMessage}
                />
            </TabsContent>
        </Tabs>
    );
}
