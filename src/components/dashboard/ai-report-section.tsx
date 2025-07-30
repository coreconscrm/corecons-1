
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createFormsReport, type FormsReport } from '@/ai/flows/create-forms-report';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Users, Building, AlertCircle, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


function ReportDisplay({ report, onUpdateReport }: { report: FormsReport, onUpdateReport: (report: FormsReport) => void }) {
    const [editingContact, setEditingContact] = useState<any | null>(null);

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
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!editingContact) return;
        setEditingContact({ ...editingContact, notas: e.target.value });
    };

    const handleSaveNotes = () => {
        if (!editingContact || !report) return;
    
        const updatedReport = JSON.parse(JSON.stringify(report)); // Deep copy
    
        const findAndReplaceContact = (category: any[] | undefined) => {
            if (!category) return false;
            for (const city of category) {
                const contactIndex = city.contactos.findIndex((c: any) => c.nombre === editingContact.nombre && c.email === editingContact.email);
                if (contactIndex > -1) {
                    city.contactos[contactIndex] = editingContact;
                    return true;
                }
            }
            return false;
        };
    
        if (!findAndReplaceContact(updatedReport.obraNueva)) {
            findAndReplaceContact(updatedReport.reformas);
        }
    
        onUpdateReport(updatedReport);
        setEditingContact(null);
    };

    const totalContacts = useMemo(() => {
        if (!report) return 0;
        const obraNuevaCount = (report.obraNueva || []).reduce((sum, city) => sum + city.contactos.length, 0);
        const reformasCount = (report.reformas || []).reduce((sum, city) => sum + city.contactos.length, 0);
        return obraNuevaCount + reformasCount;
    }, [report]);

    const renderCategory = (title: string, data: any[] | undefined) => (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                {title === 'Obra Nueva' ? <Building/> : <Users/>}
                {title}
            </h3>
            {data && data.length > 0 ? (
                <Accordion type="multiple" className="w-full" defaultValue={data.map(city => city.ciudad)}>
                    {data.map((cityGroup) => (
                        <AccordionItem value={cityGroup.ciudad} key={cityGroup.ciudad}>
                            <AccordionTrigger className="text-xl font-semibold">{cityGroup.ciudad}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cityGroup.contactos.map((contacto: any, index: number) => (
                                    <Card key={index} className="flex flex-col cursor-pointer hover:border-primary" onClick={() => setEditingContact(contacto)}>
                                        <CardHeader className="flex flex-row justify-between items-start pb-2">
                                           <CardTitle className="text-lg">{contacto.nombre}</CardTitle>
                                           <Badge variant={getPriorityVariant(contacto.prioridad)}>{contacto.prioridad}</Badge>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-1">
                                           <p><strong>Tel:</strong> {contacto.telefono}</p>
                                           <p><strong>Email:</strong> {contacto.email}</p>
                                           <p className="pt-1 text-xs truncate"><strong>Info:</strong> {contacto.origen ? JSON.parse(contacto.origen)['Información adicional'] : 'N/A'}</p>
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
            <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles del Contacto: {editingContact?.nombre}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Datos Originales del Formulario</h4>
                            <pre className="text-xs bg-muted p-3 rounded-md whitespace-pre-wrap">
                                {JSON.stringify(editingContact?.origen ? JSON.parse(editingContact.origen) : {}, null, 2)}
                            </pre>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">Notas</h4>
                            <Textarea 
                                placeholder="Añade tus notas aquí..."
                                value={editingContact?.notas || ""}
                                onChange={handleNotesChange}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setEditingContact(null)}>Cancelar</Button>
                        <Button onClick={handleSaveNotes}>Guardar Notas</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Resumen del Reporte</h2>
                <Badge variant="outline" className="text-lg py-1 px-3">
                    Total de Contactos Analizados: {totalContacts}
                </Badge>
            </div>
            {renderCategory('Obra Nueva', report.obraNueva)}
            {renderCategory('Reformas', report.reformas)}
        </div>
    )
}

export function AiReportSection({ forms }: { forms: any[] }) {
    const [report, setReport] = useState<FormsReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const reportDocRef = useMemo(() => doc(db, 'ia_reports', 'latest'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(reportDocRef, (doc) => {
            if (doc.exists()) {
                setReport(doc.data() as FormsReport);
            } else {
                setReport(null);
            }
        }, (error) => {
             console.error("Error fetching report from snapshot: ", error);
             toast({ variant: 'destructive', title: 'Error de Sincronización', description: 'No se pudo actualizar el reporte en tiempo real.'});
        });

        // Initial load check
        const getInitialReport = async () => {
             setIsLoading(true);
             try {
                const docSnap = await getDoc(reportDocRef);
                if (docSnap.exists()) {
                    setReport(docSnap.data() as FormsReport);
                }
             } catch (error) {
                 console.error("Error fetching initial report: ", error);
                 toast({ variant: 'destructive', title: 'Error de Carga', description: 'No se pudo cargar el reporte guardado.'});
             } finally {
                setIsLoading(false);
             }
        }
        getInitialReport();

        return () => unsubscribe();
    }, [reportDocRef, toast]);

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
        
        try {
            const formsJson = JSON.stringify(forms);
            const result = await createFormsReport({ formsJson });
            await setDoc(reportDocRef, JSON.parse(JSON.stringify(result)));
            
            toast({
                title: 'Reporte Generado y Guardado',
                description: 'El análisis de los formularios se ha completado y guardado en la base de datos.',
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
    
    const handleDeleteReport = async () => {
        setIsLoading(true);
        try {
            await deleteDoc(reportDocRef);
            setReport(null);
            toast({ title: 'Reporte Borrado', description: 'El reporte guardado ha sido eliminado.' });
        } catch(error) {
            console.error("Error deleting report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo borrar el reporte.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateReport = async (updatedReport: FormsReport) => {
        try {
            await setDoc(reportDocRef, updatedReport);
            toast({ title: 'Notas guardadas', description: 'Tus notas se han actualizado en el reporte.' });
        } catch (error) {
            console.error("Error updating report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar las notas.' });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Contactos con IA</CardTitle>
                <CardDescription>
                    Analiza los contactos de "Formularios Externos" para clasificarlos, agruparlos y priorizarlos. El reporte se guarda automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <BrainCircuit className="mr-2 h-4 w-4" /> )}
                        {isLoading ? 'Analizando...' : (report ? 'Volver a Generar' : 'Generar Reporte con IA')}
                    </Button>
                    {report && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" disabled={isLoading}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Borrar Reporte
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción borrará el reporte guardado. Tendrás que generarlo de nuevo.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteReport}>Sí, borrar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {isLoading && !report && (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">La IA está analizando los datos... Esto puede tardar un momento.</p>
                    </div>
                )}
                
                {report ? (
                   <ReportDisplay report={report} onUpdateReport={handleUpdateReport} />
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
