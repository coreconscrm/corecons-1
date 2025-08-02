
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { type FormsReport } from '@/ai/flows/create-forms-report';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function AiReportGenerator({ forms, onGenerateReport }: { forms: any[], onGenerateReport: () => Promise<void> }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        await onGenerateReport();
        setIsGenerating(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generador de Reportes de Prioridad</CardTitle>
                <CardDescription>
                    Analiza todos los formularios cargados (desde CSV o Google Sheets) para crear un reporte priorizado por tipo de obra y ciudad.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                    <p className="font-semibold text-lg">Formularios Cargados: {forms.length}</p>
                    <p className="text-muted-foreground text-sm">
                        {forms.length > 0 ? "Listo para analizar." : "Sube un archivo CSV o conecta una Google Sheet en la pestaña de Formularios."}
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerate} disabled={isGenerating || forms.length === 0}>
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar Reporte con IA
                </Button>
            </CardFooter>
        </Card>
    );
}

export function AiReportViewer({ latestReport }: { latestReport: FormsReport | null }) {
    const [report, setReport] = useState<FormsReport | null>(latestReport);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        setReport(latestReport);
    }, [latestReport]);

    useEffect(() => {
        const reportRef = doc(db, 'ia_reports', 'latest');
        const unsubscribe = onSnapshot(reportRef, (doc) => {
            if (doc.exists()) {
                setReport(doc.data() as FormsReport);
            } else {
                setReport(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderContactTable = (title: string, contactsByCity: FormsReport['obraNueva'] | FormsReport['reformas']) => (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-xl font-semibold">
                {title} ({contactsByCity?.reduce((acc, city) => acc + city.contactos.length, 0) || 0} contactos)
            </AccordionTrigger>
            <AccordionContent>
                {(contactsByCity || []).map(city => (
                    <div key={city.ciudad} className="mb-6">
                        <h4 className="text-lg font-bold text-primary mb-2 pl-2 border-l-4 border-primary">{city.ciudad}</h4>
                         <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {city.contactos.map((contact, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Badge variant={contact.prioridad === "Alta" ? "destructive" : contact.prioridad === "Media" ? "default" : "secondary"}>
                                                    {contact.prioridad}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{contact.nombre}</TableCell>
                                            <TableCell>{contact.telefono}</TableCell>
                                            <TableCell>{contact.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    </div>
                ))}
            </AccordionContent>
        </AccordionItem>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Cargando último reporte...</span>
            </div>
        );
    }
    
    if (!report) {
         return (
             <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <BrainCircuit className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay reportes generados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ve a la pestaña "Generador de Reportes" para crear uno.
                </p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Visor de Reporte de Prioridad</CardTitle>
                <CardDescription>
                    Este es el último reporte generado por la IA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-4">
                    {renderContactTable("Obra Nueva", report.obraNueva)}
                    {renderContactTable("Reformas", report.reformas)}
                </Accordion>
            </CardContent>
        </Card>
    );
}
