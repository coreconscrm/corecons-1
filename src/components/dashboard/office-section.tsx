
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, BookUser } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JuanFranNotesCard, type JuanFranNote } from "./juanfran-notes-card";

export function OfficeSection({
    juanfranNotes,
    onAddJuanfranNote,
    onUpdateJuanfranNote,
    onDeleteJuanfranNote,
}: {
    juanfranNotes: JuanFranNote[];
    onAddJuanfranNote: (note: any) => void;
    onUpdateJuanfranNote: (note: any) => void;
    onDeleteJuanfranNote: (id: string) => void;
}) {
    return (
        <Tabs defaultValue="juanfran" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="juanfran">
                    <BookUser className="mr-2" />
                    Apuntes de JuanFran
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
        </Tabs>
    );
}
