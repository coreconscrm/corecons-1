
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Phone, ListChecks, FileUp, Users, FileDown, ThumbsDown, ThumbsUp, CheckCircle, Clock, Send, FilePlus, PhoneForwarded, PhoneOff } from "lucide-react";
import type { Project } from '@/components/dashboard/projects/projects-section';
import type { Budget } from '@/components/dashboard/budgets/budgets-section';
import type { ColumnConfig } from '@/components/dashboard/forms/forms-section';

// Define the types for the props based on what the main page will pass
interface PanelControlProps {
    juanfranNotes: any[];
    julianNotes: any[];
    sandraNotes: any[];
    jordanChecklists: any[];
    daniPriorities: any[];
    chatMessages: any[];
    seguimientos: any[];
    budgets: Budget[];
    forms: any[]; // sheetForms
    contacts: any[]; // contacts from forms
}

// A small component for each stat item in the cards
const StatItem = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="flex flex-col items-center justify-center space-y-1 text-center">
        <div className="relative">
            {icon}
            {value > 0 && (
                 <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {value}
                </span>
            )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);


export function PanelControl({
    juanfranNotes,
    julianNotes,
    sandraNotes,
    jordanChecklists,
    daniPriorities,
    chatMessages,
    seguimientos,
    budgets,
    forms,
    contacts
}: PanelControlProps) {

    // --- Calculations ---

    // 1. Resumen de Oficina
    const oficinaStats = {
        juanfran: juanfranNotes.length,
        julian: julianNotes.length,
        sandra: sandraNotes.length,
        jordan: jordanChecklists.length,
        dani: daniPriorities.length,
        chats: chatMessages.length,
    };

    // 2. Llamadas de Seguimiento (based on image categories)
    const getSeguimientoCount = (category: string) => {
        return seguimientos.filter(s => s.estado === category).length;
    };
    const seguimientoStats = {
        llamar: getSeguimientoCount("Llamar"),
        total: seguimientos.length,
        presentarHoy: getSeguimientoCount("A presentar hoy"),
        pasarArquitecto: getSeguimientoCount("Pasar a Arquitecto"),
        enviarPresupuesto: getSeguimientoCount("Enviar Presupuesto"),
        subcontratas: getSeguimientoCount("Subcontratas"),
        pasarInmobiliaria: getSeguimientoCount("Pasar a Inmobiliaria"),
        seguimientoReforma: getSeguimientoCount("Seguimiento reforma"),
        seguimientoDocumentacion: getSeguimientoCount("Seguimiento documentacion"),
        noInteresa: getSeguimientoCount("No les interesa"),
        hacerPresupuesto: getSeguimientoCount("Hacer presupuesto"),
        noContactar: getSeguimientoCount("No podemos contactar"),
        pensativos: getSeguimientoCount("Clientes pensativos"),
        seguimientoPresupuestos: getSeguimientoCount("Seguimiento presupuestos a presentar o presentados"),
        obrasPequenas: getSeguimientoCount("Obras pequeñas, no interesan"),
        hecho: getSeguimientoCount("Hecho! pasar a limpio"),
    };

    // 3. Resumen de Presupuestos
    const getBudgetCount = (estado: string) => budgets.filter(b => b.estado === estado).length;
    const budgetStats = {
        pendientes: getBudgetCount("Pendiente"),
        enviados: getBudgetCount("Enviado"),
        aceptados: getBudgetCount("Aceptado"),
        rechazados: getBudgetCount("Rechazado"),
        hechos: getBudgetCount("Hecho"),
    };

    // 4. Resumen de Formularios
    const formStats = {
        formularios: forms.length + contacts.length,
        llamados: contacts.length,
        pendientes: forms.length,
    };

    return (
        <div className="p-4">
             <h2 className="text-2xl font-bold mb-4">Panel de Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Resumen de Oficina */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Oficina</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-y-6">
                        <StatItem icon={<FileText className="h-6 w-6" />} value={oficinaStats.juanfran} label="Juanfran" />
                        <StatItem icon={<FileText className="h-6 w-6" />} value={oficinaStats.julian} label="Julián" />
                        <StatItem icon={<FileText className="h-6 w-6" />} value={oficinaStats.sandra} label="Sandra" />
                        <StatItem icon={<ListChecks className="h-6 w-6" />} value={oficinaStats.jordan} label="Jordan" />
                        <StatItem icon={<FileUp className="h-6 w-6" />} value={oficinaStats.dani} label="Dani" />
                        <StatItem icon={<Users className="h-6 w-6" />} value={oficinaStats.chats} label="Chats" />
                    </CardContent>
                </Card>

                {/* Llamadas de Seguimiento */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Llamadas de Seguimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-y-6 text-center">
                         <StatItem icon={<Phone className="h-6 w-6 text-green-500"/>} value={seguimientoStats.llamar} label="Llamar" />
                         <StatItem icon={<ListChecks className="h-6 w-6" />} value={seguimientoStats.total} label="Total" />
                         <StatItem icon={<FileUp className="h-6 w-6 text-blue-500" />} value={seguimientoStats.presentarHoy} label="A Presentar Hoy" />
                         <StatItem icon={<Users className="h-6 w-6" />} value={seguimientoStats.pasarArquitecto} label="Pasar Arquitecto" />
                         <StatItem icon={<Send className="h-6 w-6" />} value={seguimientoStats.enviarPresupuesto} label="Enviar Presupuesto" />
                         <StatItem icon={<Users className="h-6 w-6" />} value={seguimientoStats.subcontratas} label="Subcontratas" />
                         <StatItem icon={<Users className="h-6 w-6" />} value={seguimientoStats.pasarInmobiliaria} label="Pasar Inmobiliaria" />
                         <StatItem icon={<ListChecks className="h-6 w-6" />} value={seguimientoStats.seguimientoReforma} label="Seg. Reforma" />
                         <StatItem icon={<FileText className="h-6 w-6" />} value={seguimientoStats.seguimientoDocumentacion} label="Seg. Documentación" />
                         <StatItem icon={<ThumbsDown className="h-6 w-6 text-red-500" />} value={seguimientoStats.noInteresa} label="No les interesa" />
                         <StatItem icon={<FilePlus className="h-6 w-6" />} value={seguimientoStats.hacerPresupuesto} label="Hacer Presupuesto" />
                         <StatItem icon={<PhoneOff className="h-6 w-6 text-red-500" />} value={seguimientoStats.noContactar} label="No podemos contactar" />
                    </CardContent>
                </Card>

                {/* Resumen de Presupuestos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Presupuestos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-y-6">
                        <StatItem icon={<Clock className="h-6 w-6 text-yellow-500" />} value={budgetStats.pendientes} label="Pendientes" />
                        <StatItem icon={<Send className="h-6 w-6 text-blue-500" />} value={budgetStats.enviados} label="Enviados" />
                        <StatItem icon={<ThumbsUp className="h-6 w-6 text-green-500" />} value={budgetStats.aceptados} label="Aceptados" />
                        <StatItem icon={<ThumbsDown className="h-6 w-6 text-red-500" />} value={budgetStats.rechazados} label="Rechazados" />
                        <StatItem icon={<CheckCircle className="h-6 w-6 text-green-700" />} value={budgetStats.hechos} label="Hechos" />
                    </CardContent>
                </Card>

                {/* Resumen de Formularios */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Formularios</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-y-6">
                        <StatItem icon={<FileDown className="h-6 w-6" />} value={formStats.formularios} label="Formularios" />
                        <StatItem icon={<PhoneForwarded className="h-6 w-6 text-green-500" />} value={formStats.llamados} label="Llamados" />
                        <StatItem icon={<Clock className="h-6 w-6 text-yellow-500" />} value={formStats.pendientes} label="Pendientes" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
