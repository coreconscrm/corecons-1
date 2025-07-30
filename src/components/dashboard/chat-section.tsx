
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export function ChatSection() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare /> Chat
                </CardTitle>
                <CardDescription>
                    Un asistente de IA para ayudarte con tus preguntas y tareas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                    <MessageSquare className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">El chat está en construcción</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Próximamente podrás interactuar con la IA aquí.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
