
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit } from "lucide-react";

export function AiSection() {
    return (
        <Tabs defaultValue="content-generator">
            <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="content-generator">Generador de Contenido</TabsTrigger>
            </TabsList>
            <TabsContent value="content-generator">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Asistente de IA para Contenidos</CardTitle>
                                <CardDescription>
                                    Genera descripciones, textos para redes sociales y más.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Próximamente: Herramientas de IA para ayudarte a crear contenido atractivo para tus proyectos, memorias y comunicaciones.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
