
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createFormsReport, type FormsReport } from '@/ai/flows/create-forms-report';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Users, Building, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';

function ReportDisplay({ report }: { report: FormsReport }) {

    const getPriorityVariant = (priority: 'Alta' | 'Media' | 'Baja') => {
        switch (priority) {
            case 'Alta':
                return 'destructive';
            case 'Media':
                return 'default';
            case 'Baja':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const renderCategory = (title: string, data: FormsReport['obraNueva'] | FormsReport['reformas']) => (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                {title === 'Obra Nueva' ? <Building/> : <Users/>}
                {title}
            </h3>
            {data.length > 0 ? (
                <Accordion type="multiple" className="w-full" defaultValue={data.map(city => city.ciudad)}>
                    {data.map((cityGroup) => (
                        <AccordionItem value={cityGroup.ciudad} key={cityGroup.ciudad}>
                            <AccordionTrigger className="text-xl font-semibold">{cityGroup.ciudad}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cityGroup.contactos.map((contacto, index) => (
                                    <Card key={index} className="flex flex-col">
                                        <CardHeader className="flex flex-row justify-between items-start pb-2">
                                           <CardTitle className="text-lg">{contacto.nombre}</CardTitle>
                                           <Badge variant={getPriorityVariant(contacto.prioridad)}>{contacto.prioridad}</Badge>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground">
                                           <p>{contacto.telefono}</p>
                                           <p>{contacto.email}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-muted-foreground">No se encontraron contactos para esta categoría.</p>
            )}
        </div>
    );
    

    return (
        <div className="space-y-8 mt-6">
            {renderCategory('Obra Nueva', report.obraNueva)}
            {renderCategory('Reformas', report.reformas)}
        </div>
    )
}

export function AiReportSection({ forms }: { forms: any[] }) {
    const [report, setReport] = useState<FormsReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerateReport = async () => {
        if (forms.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No hay datos',
                description: 'No hay formularios externos para analizar. Carga un CSV o conecta Google Sheets.',
            });
            return;
        }

        setIsLoading(true);
        setReport(null);

        try {
            const formsJson = JSON.stringify(forms);
            const result = await createFormsReport({ formsJson });
            setReport(result);
            toast({
                title: 'Reporte Generado',
                description: 'El análisis de los formularios se ha completado.',
            });
        } catch (error) {
            console.error("Error generating AI report:", error);
            toast({
                variant: 'destructive',
                title: 'Error de IA',
                description: `No se pudo generar el reporte. ${(error as Error).message}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Contactos con IA</CardTitle>
                <CardDescription>
                    Analiza los contactos de la tabla "Formularios Externos" para clasificarlos,
                    agruparlos por ciudad y priorizarlos automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <BrainCircuit className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Analizando Contactos...' : 'Generar Reporte con IA'}
                </Button>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">La IA está analizando los datos... Esto puede tardar un momento.</p>
                    </div>
                )}
                
                {report ? (
                   <ReportDisplay report={report} />
                ) : (
                   !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg mt-6">
                            <AlertCircle className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">El reporte aparecerá aquí</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Haz clic en el botón para comenzar el análisis.
                            </p>
                        </div>
                   )
                )}

            </CardContent>
        </Card>
    );
}
