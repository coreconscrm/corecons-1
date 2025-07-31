
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookUser, MessageSquare, ListChecks } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JuanFranNotesCard, type JuanFranNote } from "./juanfran-notes-card";
import { SandraNotesCard, type SandraNote } from "./sandra-notes-card";
import { JordanChecklistCard, type Checklist } from "./jordan-checklist-card";
import { DaniPrioritiesCard, type DaniPriority } from "./dani-priorities-card";
import { ChatSection } from "./chat-section";

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
    chatMessages,
    team,
    onAddChatMessage,
    onUpdateChatMessage,
    onDeleteChatMessage,
}: {
    juanfranNotes: JuanFranNote[];
    onAddJuanfranNote: (note: any) => void;
    onUpdateJuanfranNote: (note: any) => void;
    onDeleteJuanfranNote: (id: string) => void;
    sandraNotes: SandraNote[];
    onAddSandraNote: (note: any) => void;
    onUpdateSandraNote: (note: any) => void;
    onDeleteSandraNote: (id: string) => void;
    jordanChecklists: Checklist[];
    onAddJordanChecklist: (c: any) => void;
    onUpdateJordanChecklist: (c: any) => void;
    onDeleteJordanChecklist: (id: string) => void;
    daniPriorities: DaniPriority[];
    onAddDaniPriority: (p: any) => void;
    onUpdateDaniPriority: (p: any) => void;
    onDeleteDaniPriority: (id: string) => void;
    chatMessages: any[];
    team: any[];
    onAddChatMessage: (message: any) => void;
    onUpdateChatMessage: (message: any) => void;
    onDeleteChatMessage: (id: string) => void;
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
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="juanfran">
                    <BookUser className="mr-2" />
                    Apuntes de JuanFran
                </TabsTrigger>
                <TabsTrigger value="sandra">
                    <BookUser className="mr-2" />
                    Apuntes de Sandra
                </TabsTrigger>
                <TabsTrigger value="jordan">
                    <ListChecks className="mr-2" />
                    CheckList de Jordan
                </TabsTrigger>
                 <TabsTrigger value="dani">
                    <BookUser className="mr-2" />
                    Prioridades para Dani
                </TabsTrigger>
                 <TabsTrigger value="chat">
                    <MessageSquare className="mr-2" />
                    Chat
                </TabsTrigger>
            </TabsList>
            <TabsContent value="juanfran" className="mt-6">
                 <JuanFranNotesCard
                    notes={juanfranNotes}
                    onAddNote={onAddJuanfranNote}
                    onUpdateNote={onUpdateJuanfranNote}
                    onDeleteNote={onDeleteJuanfranNote}
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
                <JordanChecklistCard
                    checklists={jordanChecklists}
                    onAddChecklist={onAddJordanChecklist}
                    onUpdateChecklist={onUpdateJordanChecklist}
                    onDeleteChecklist={onDeleteJordanChecklist}
                />
            </TabsContent>
            <TabsContent value="dani" className="mt-6">
                <DaniPrioritiesCard
                    priorities={daniPriorities}
                    onAddPriority={onAddDaniPriority}
                    onUpdatePriority={onUpdateDaniPriority}
                    onDeletePriority={onDeleteDaniPriority}
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
