
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookUser, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JuanFranNotesCard, type JuanFranNote } from "./juanfran-notes-card";
import { ChatSection } from "./chat-section";

export function OfficeSection({
    juanfranNotes,
    onAddJuanfranNote,
    onUpdateJuanfranNote,
    onDeleteJuanfranNote,
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
    chatMessages: any[];
    team: any[];
    onAddChatMessage: (message: any) => void;
    onUpdateChatMessage: (message: any) => void;
    onDeleteChatMessage: (id: string) => void;
}) {
    return (
        <Tabs defaultValue="juanfran" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="juanfran">
                    <BookUser className="mr-2" />
                    Apuntes de JuanFran
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
