
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from "@/components/ui/table";
import { BrainCircuit, UploadCloud, FileText, CheckCircle, AlertCircle, X, ArrowUpDown, Database, Loader2, Save, Trash2, Search, FileUp, History, Undo, FileInput, Server, Plus, Pencil, Printer, Merge, Building, Users, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs, writeBatch, doc, deleteDoc, updateDoc, setDoc, limit, startAt, endAt, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { createProjectBreakdown, type ProjectBreakdown } from "@/ai/flows/create-project-breakdown";
import { createFormsReport, type FormsReport } from '@/ai/flows/create-forms-report';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogHeader, DialogFooter, DialogClose, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "../ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AiBudgetPrintLayout, type ProjectBreakdownChapter } from "./budget-print-layout";
import type { Company } from "./company-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";


// --- Tipos de Datos ---
type UploadStatus = "pending" | "uploading" | "processing" | "success" | "error";
type UploadedFile = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
  errorMessage?: string;
};
type PriceHistoryEntry = {
    precio: number;
    fecha: any; // Firestore Timestamp
    archivoOrigen: string;
}
type PriceMasterItem = {
  id: string;
  descripcion: string;
  unidad: string;
  capitulo: string;
  precioActual: number;
  fechaUltimaActualizacion: string;
  historialPrecios: PriceHistoryEntry[];
  status: 'new' | 'updated';
};
export type AiBudgetItem = {
  id: string;
  fileName: string;
  title: string;
  clientName?: string;
  description?: string;
  createdAt: any; // Firestore Timestamp
  breakdown: ProjectBreakdown;
  userLineTotals?: Record<string, Record<string, number>>;
};


const budgetDetailsSchema = z.object({
    title: z.string().min(1, "El título es requerido."),
    clientName: z.string().optional(),
    description: z.string().optional(),
});

const mergeBudgetSchema = z.object({
  targetBudgetId: z.string().min(1, "Debes seleccionar un presupuesto de destino."),
});

const addToBudgetSchema = z.object({
  category: z.enum(["obra_nueva", "reformas"], {
    required_error: "Debes seleccionar una categoría.",
  }),
});


// --- Componente para Generador de Desglose ---
function BudgetUploader({ 
    title,
    description,
    onAnalysisComplete,
    saveButtonLabel,
    saveButtonIcon
}: { 
    title: string;
    description: string;
    onAnalysisComplete: (breakdown: ProjectBreakdown, fileName: string) => Promise<void>;
    saveButtonLabel: string;
    saveButtonIcon: React.ReactNode;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [breakdown, setBreakdown] = useState<ProjectBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setBreakdown(null); // Reset breakdown when new file is selected
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un archivo PDF." });
      return;
    }

    setIsLoading(true);
    setBreakdown(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const result = await createProjectBreakdown({ pdfDataUri: dataUri });
          setBreakdown(result);
          toast({ title: "Desglose generado", description: "El proyecto ha sido desglosado exitosamente. Ahora puedes guardarlo." });
        } catch (error) {
            console.error("Error generating breakdown:", error);
            toast({ variant: "destructive", title: "Error de IA", description: `No se pudo generar el desglose. ${(error as Error).message}` });
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ variant: "destructive", title: "Error de archivo", description: "No se pudo leer el archivo seleccionado." });
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Error setting up file reader:", e);
      toast({ variant: "destructive", title: "Error", description: `Ocurrió un error inesperado.` });
      setIsLoading(false);
    }
  };

  const handleSaveClick = async () => {
    if (!breakdown || !file) {
       toast({ variant: "destructive", title: "Error", description: "No hay desglose para guardar." });
       return;
    }
    setIsSaving(true);
    try {
        await onAnalysisComplete(breakdown, file.name);
        setBreakdown(null);
        setFile(null);
    } catch (error) {
        // Error toast is handled in parent
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-center">
              {isDragActive
                ? "Suelta el archivo aquí..."
                : "Arrastra y suelta un PDF aquí, o haz clic para seleccionar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Solo archivos PDF</p>
          </div>
          {file && (
            <div className="p-3 border rounded-lg text-sm flex items-center justify-between">
              <p className="truncate font-medium flex items-center gap-2">
                <FileText size={16} /> {file.name}
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); setBreakdown(null); }}>
                <X size={16} />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={!file || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Analizando..." : "Analizar con IA"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultado del Análisis</CardTitle>
          <CardDescription>Aquí aparecerán los capítulos y partidas generados por la IA.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-60">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Analizando documento y generando desglose...</p>
            </div>
          )}
          {breakdown && breakdown.capitulos.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {breakdown.capitulos.map((capitulo, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">{capitulo.nombre}</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partida</TableHead>
                          <TableHead className="text-right">Medición</TableHead>
                          <TableHead className="text-center">Unidad</TableHead>
                          <TableHead className="text-right">Precio/Ud.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {capitulo.partidas.map((partida, pIndex) => (
                          <TableRow key={pIndex}>
                            <TableCell>{partida.descripcion}</TableCell>
                            <TableCell className="text-right">{partida.medicion}</TableCell>
                            <TableCell className="text-center">{partida.unidad}</TableCell>
                            <TableCell className="text-right">{partida.precioUnitario}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
                <p>El resultado aparecerá aquí después del análisis.</p>
              </div>
            )
          )}
        </CardContent>
        {breakdown && breakdown.capitulos.length > 0 && (
          <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleSaveClick} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saveButtonIcon}
              {saveButtonLabel}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


function BudgetDetailsDialog({ budget, open, onOpenChange, onSave }: { budget: AiBudgetItem, open: boolean, onOpenChange: (open: boolean) => void, onSave: (id: string, values: z.infer<typeof budgetDetailsSchema>) => void }) {
    const form = useForm<z.infer<typeof budgetDetailsSchema>>({
        resolver: zodResolver(budgetDetailsSchema),
        defaultValues: {
            title: budget.title || budget.fileName,
            clientName: budget.clientName || "",
            description: budget.description || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                title: budget.title || budget.fileName,
                clientName: budget.clientName || "",
                description: budget.description || "",
            });
        }
    }, [budget, open, form]);

    const handleSubmit = (values: z.infer<typeof budgetDetailsSchema>) => {
        onSave(budget.id, values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Detalles del Presupuesto</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Presupuesto</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="clientName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Cliente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción / Notas</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Añade detalles sobre el proyecto..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function MergeBudgetDialog({
    sourceBudget,
    allBudgets,
    open,
    onOpenChange,
    onMerge,
}: {
    sourceBudget: AiBudgetItem;
    allBudgets: AiBudgetItem[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMerge: (sourceId: string, targetId: string) => void;
}) {
    const form = useForm<z.infer<typeof mergeBudgetSchema>>({
        resolver: zodResolver(mergeBudgetSchema),
    });

    const potentialTargets = allBudgets.filter(b => b.id !== sourceBudget.id);

    const handleSubmit = (values: z.infer<typeof mergeBudgetSchema>) => {
        onMerge(sourceBudget.id, values.targetBudgetId);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unir Presupuestos</DialogTitle>
                    <DialogDescription>
                        Vas a unir "{sourceBudget.title}" con otro presupuesto. El presupuesto actual se borrará y sus partidas se añadirán al presupuesto de destino.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="targetBudgetId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selecciona el presupuesto de destino</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Elige un presupuesto..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {potentialTargets.map(b => (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Confirmar Fusión</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function AddToBudgetDialog({
    budget,
    open,
    onOpenChange,
    onConfirm
}: {
    budget: AiBudgetItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (category: 'obra_nueva' | 'reformas') => void;
}) {
    const form = useForm<z.infer<typeof addToBudgetSchema>>({
        resolver: zodResolver(addToBudgetSchema),
    });

    const handleSubmit = (values: z.infer<typeof addToBudgetSchema>) => {
        onConfirm(values.category);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir a Presupuestos</DialogTitle>
                    <DialogDescription>
                        Selecciona a qué sección de presupuestos quieres añadir "{budget.title}".
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Elige una categoría:</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="obra_nueva" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        Obra Nueva
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="reformas" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        Reformas
                                        </FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit">Añadir Presupuesto</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


// --- Componente para una tarjeta de presupuesto de IA ---
function AiBudgetCard({ 
    budget, 
    onLineTotalChange, 
    onDetailsChange,
    onDelete,
    onPrint,
    onMergeClick,
    onAddToBudgetClick,
    onChapterNameChange
}: { 
    budget: AiBudgetItem, 
    onLineTotalChange: (budgetId: string, capitulo: string, partida: string, total: string) => void,
    onDetailsChange: (id: string, values: z.infer<typeof budgetDetailsSchema>) => void,
    onDelete: (id: string) => void,
    onPrint: (budget: AiBudgetItem) => void,
    onMergeClick: (budget: AiBudgetItem) => void,
    onAddToBudgetClick: (budget: AiBudgetItem) => void,
    onChapterNameChange: (budgetId: string, oldName: string, newName: string) => void,
}) {
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<{ oldName: string; newName: string } | null>(null);

    const budgetTotals = useMemo(() => {
        let grandTotal = 0;
        const chapterTotals: Record<string, number> = {};

        if (budget.breakdown.capitulos) {
            for (const capitulo of budget.breakdown.capitulos) {
                const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                    const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                    return sum + lineTotal;
                }, 0);
                chapterTotals[capitulo.nombre] = chapterTotal;
                grandTotal += chapterTotal;
            }
        }
        return { grandTotal, chapterTotals };
    }, [budget.breakdown, budget.userLineTotals]);
    
    const handleChapterNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (editingChapter && editingChapter.newName.trim()) {
                onChapterNameChange(budget.id, editingChapter.oldName, editingChapter.newName.trim());
                setEditingChapter(null);
            }
        } else if (e.key === 'Escape') {
            setEditingChapter(null);
        }
    };


    return (
        <AccordionItem value={budget.id} className="border-none">
            {isDetailsDialogOpen && (
                <BudgetDetailsDialog
                    budget={budget}
                    open={isDetailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                    onSave={onDetailsChange}
                />
            )}
            <Card key={budget.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                        <div className="text-left">
                            <h3 className="font-semibold text-lg">{budget.title || budget.fileName}</h3>
                            <CardDescription className="mt-1">
                                {budget.clientName && <span className="font-semibold">{budget.clientName}</span>}
                                {budget.clientName && budget.description && " - "}
                                {budget.description && <span>{budget.description}</span>}
                                {!budget.clientName && !budget.description && `Analizado el: ${budget.createdAt?.toDate ? format(budget.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Fecha desconocida'}`}
                            </CardDescription>
                        </div>
                    </AccordionTrigger>
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => onAddToBudgetClick(budget)}>
                                    <FolderPlus className="mr-2 h-4 w-4" /> Añadir a Presupuestos
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setDetailsDialogOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onPrint(budget)}>
                                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                                </DropdownMenuItem>
                                 <DropdownMenuItem onSelect={() => onMergeClick(budget)}>
                                    <Merge className="mr-2 h-4 w-4" /> Unir con...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Presupuesto
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente este presupuesto analizado.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(budget.id)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <AccordionContent>
                    <CardContent className="flex-grow space-y-6">
                        <Accordion type="multiple" className="w-full">
                            {budget.breakdown.capitulos.map((capitulo, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                                        {editingChapter?.oldName === capitulo.nombre ? (
                                            <Input 
                                                value={editingChapter.newName}
                                                onChange={(e) => setEditingChapter({ ...editingChapter, newName: e.target.value })}
                                                onKeyDown={handleChapterNameKeyDown}
                                                onBlur={() => setEditingChapter(null)}
                                                autoFocus
                                                className="h-8"
                                            />
                                        ) : (
                                            <>
                                                <span>{capitulo.nombre}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setEditingChapter({ oldName: capitulo.nombre, newName: capitulo.nombre }); 
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-2/5">Partida</TableHead>
                                                    <TableHead className="text-right">Medición</TableHead>
                                                    <TableHead className="text-center">Unidad</TableHead>
                                                    <TableHead className="text-right">Tu Precio (€/ud)</TableHead>
                                                    <TableHead className="text-right">Total Partida (€)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {capitulo.partidas.map((partida, pIndex) => {
                                                    const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                                                    const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                                                    const userPrice = quantity !== 0 ? lineTotal / quantity : 0;
                                                    return (
                                                    <TableRow key={pIndex}>
                                                        <TableCell>{partida.descripcion}</TableCell>
                                                        <TableCell className="text-right">{partida.medicion}</TableCell>
                                                        <TableCell className="text-center">{partida.unidad}</TableCell>
                                                        <TableCell className="text-right font-mono">
                                                          {userPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right w-[150px]">
                                                             <Input
                                                                type="number"
                                                                className="text-right"
                                                                placeholder="0.00"
                                                                defaultValue={lineTotal || ''}
                                                                onBlur={(e) => onLineTotalChange(budget.id, capitulo.nombre, partida.descripcion, e.target.value)}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                )})}
                                            </TableBody>
                                            <UiTableFooter>
                                                <TableRow className="bg-secondary/50 hover:bg-secondary">
                                                    <TableCell colSpan={4} className="text-right font-bold">Total Capítulo</TableCell>
                                                    <TableCell className="text-right font-bold font-mono">
                                                        €{(budgetTotals.chapterTotals[capitulo.nombre] || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            </UiTableFooter>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="summary">
                                <AccordionTrigger className="text-lg font-semibold">Resumen de Capítulos</AccordionTrigger>
                                <AccordionContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Capítulo</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.entries(budgetTotals.chapterTotals).map(([nombre, total]) => (
                                                    <TableRow key={nombre}>
                                                        <TableCell className="font-semibold">{nombre}</TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            €{total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                    <CardFooter className="justify-end bg-secondary/80 p-4 mt-auto">
                        <div className="text-xl font-bold">
                            Total Presupuesto (Tus Precios): <span className="font-mono">€{budgetTotals.grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </CardFooter>
                </AccordionContent>
            </Card>
        </AccordionItem>
    );
}


// --- Componente de la Sección de Presupuestos de IA ---
function AiBudgetsSection({ 
    companies,
    onCreateBudgetFromAi,
}: { 
    companies: Company[],
    onCreateBudgetFromAi: (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas') => void;
}) {
    const [aiBudgets, setAiBudgets] = useState<AiBudgetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [printingBudget, setPrintingBudget] = useState<AiBudgetItem | null>(null);
    const [mergingBudget, setMergingBudget] = useState<AiBudgetItem | null>(null);
    const [addingToBudget, setAddingToBudget] = useState<AiBudgetItem | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "ia_budgets"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const budgetData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AiBudgetItem[];
            setAiBudgets(budgetData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching AI budgets:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (printingBudget) {
            const timer = setTimeout(() => {
                window.print();
                setPrintingBudget(null);
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [printingBudget]);

    const handleLineTotalChange = async (budgetId: string, capitulo: string, partida: string, total: string) => {
        const budgetRef = doc(db, 'ia_budgets', budgetId);
        const totalValue = parseFloat(total);
        const newTotal = isNaN(totalValue) ? 0 : totalValue;

        const currentBudget = aiBudgets.find(b => b.id === budgetId);
        if (!currentBudget) return;
        
        const updatedTotals = {
            ...currentBudget.userLineTotals,
            [capitulo]: {
                ...(currentBudget.userLineTotals?.[capitulo] || {}),
                [partida]: newTotal
            }
        };

        try {
            await setDoc(budgetRef, { userLineTotals: updatedTotals }, { merge: true });
        } catch (error) {
            console.error("Error updating user total:", error);
            toast({ variant: 'destructive', title: 'Error al guardar total', description: 'No se pudo actualizar el total en la base de datos.'});
        }
    };
    
    const handleDetailsChange = async (id: string, values: z.infer<typeof budgetDetailsSchema>) => {
        const budgetRef = doc(db, 'ia_budgets', id);
        try {
            await updateDoc(budgetRef, values);
            toast({ title: "Detalles actualizados", description: "La información del presupuesto se ha guardado." });
        } catch (error) {
            console.error("Error updating budget details:", error);
            toast({ variant: 'destructive', title: 'Error al actualizar', description: 'No se pudieron guardar los detalles del presupuesto.' });
        }
    };

    const handleDeleteBudget = async (id: string) => {
        try {
            await deleteDoc(doc(db, "ia_budgets", id));
            toast({ title: "Presupuesto eliminado", description: "El presupuesto analizado ha sido borrado." });
        } catch (error) {
            console.error(`Error deleting budget ${id}:`, error);
            toast({ variant: "destructive", title: "Error al eliminar", description: `No se pudo eliminar el presupuesto.`});
        }
    };

    const handleMergeBudgets = async (sourceId: string, targetId: string) => {
        const sourceBudget = aiBudgets.find(b => b.id === sourceId);
        const targetBudget = aiBudgets.find(b => b.id === targetId);

        if (!sourceBudget || !targetBudget) {
            toast({ variant: "destructive", title: "Error", description: "No se encontraron los presupuestos para unir." });
            return;
        }

        const mergedBreakdown: ProjectBreakdownChapter[] = [...targetBudget.breakdown.capitulos];
        const mergedTotals = { ...targetBudget.userLineTotals };

        for (const sourceChapter of sourceBudget.breakdown.capitulos) {
            const targetChapter = mergedBreakdown.find(c => c.nombre === sourceChapter.nombre);
            if (targetChapter) {
                // Merge partidas into existing chapter
                targetChapter.partidas.push(...sourceChapter.partidas);
            } else {
                // Add new chapter
                mergedBreakdown.push(sourceChapter);
            }
        }
        
        // Merge user prices
        for (const [chapterName, partidas] of Object.entries(sourceBudget.userLineTotals || {})) {
            if (!mergedTotals[chapterName]) {
                mergedTotals[chapterName] = {};
            }
             Object.assign(mergedTotals[chapterName], partidas);
        }

        try {
            const batch = writeBatch(db);
            const targetRef = doc(db, 'ia_budgets', targetId);
            batch.update(targetRef, { 
                'breakdown.capitulos': mergedBreakdown,
                'userLineTotals': mergedTotals
            });

            const sourceRef = doc(db, 'ia_budgets', sourceId);
            batch.delete(sourceRef);

            await batch.commit();
            toast({ title: "Fusión completada", description: `"${sourceBudget.title}" se ha unido con "${targetBudget.title}".` });

        } catch (error) {
            console.error("Error merging budgets:", error);
            toast({ variant: "destructive", title: "Error al fusionar", description: `No se pudieron unir los presupuestos. ${(error as Error).message}` });
        }
    };
    
    const handleChapterNameChange = async (budgetId: string, oldName: string, newName: string) => {
        const budget = aiBudgets.find(b => b.id === budgetId);
        if (!budget || oldName === newName) return;
    
        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const chapter = newBreakdown.capitulos.find((c: any) => c.nombre === oldName);
        if (chapter) {
            chapter.nombre = newName;
        }
    
        const newUserLineTotals = { ...budget.userLineTotals };
        if (newUserLineTotals[oldName]) {
            newUserLineTotals[newName] = newUserLineTotals[oldName];
            delete newUserLineTotals[oldName];
        }
    
        try {
            const budgetRef = doc(db, 'ia_budgets', budgetId);
            await updateDoc(budgetRef, {
                breakdown: newBreakdown,
                userLineTotals: newUserLineTotals
            });
            toast({ title: "Capítulo renombrado", description: `"${oldName}" ahora es "${newName}".` });
        } catch (error) {
            console.error("Error renaming chapter:", error);
            toast({ variant: 'destructive', title: 'Error al renombrar', description: 'No se pudo guardar el nuevo nombre del capítulo.' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Cargando presupuestos...</span>
            </div>
        );
    }
    
    return (
      <div className="space-y-6">
          {mergingBudget && (
                <MergeBudgetDialog
                    sourceBudget={mergingBudget}
                    allBudgets={aiBudgets}
                    open={!!mergingBudget}
                    onOpenChange={() => setMergingBudget(null)}
                    onMerge={handleMergeBudgets}
                />
            )}
            {addingToBudget && (
                <AddToBudgetDialog
                    budget={addingToBudget}
                    open={!!addingToBudget}
                    onOpenChange={() => setAddingToBudget(null)}
                    onConfirm={(category) => onCreateBudgetFromAi(addingToBudget, category)}
                />
            )}
          <div className="printable-area">
                <AiBudgetPrintLayout 
                    budget={printingBudget}
                    company={companies.length > 0 ? companies[0] : null}
                />
            </div>
          {aiBudgets.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
                {aiBudgets.map(budget => (
                    <AiBudgetCard
                        key={budget.id}
                        budget={budget}
                        onLineTotalChange={handleLineTotalChange}
                        onDetailsChange={handleDetailsChange}
                        onDelete={handleDeleteBudget}
                        onPrint={setPrintingBudget}
                        onMergeClick={setMergingBudget}
                        onAddToBudgetClick={setAddingToBudget}
                        onChapterNameChange={handleChapterNameChange}
                    />
                ))}
            </Accordion>
          ) : (
             <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <FileInput className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay presupuestos analizados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ve a la pestaña "Subir para Presupuestos IA" para empezar.
                </p>
            </div>
          )}
      </div>
    );
}

// --- Componente de la Sección de Base de Precios ---
function PriceDatabaseSection() {
    const { toast } = useToast();
    const [prices, setPrices] = useState<PriceMasterItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [viewingDescription, setViewingDescription] = useState<string | null>(null);
    const [viewingOrigin, setViewingOrigin] = useState<string | null>(null);
    const [viewingHistory, setViewingHistory] = useState<PriceMasterItem | null>(null);

    const handleSearch = useCallback(async (term: string) => {
        if (!term) {
            setPrices([]);
            return;
        }
        setIsSearching(true);
        try {
            const pricesRef = collection(db, "preciosMaestros");
            const searchKeywords = term.toLowerCase().split(' ').filter(Boolean);

            if (searchKeywords.length === 0) {
                setPrices([]);
                setIsSearching(false);
                return;
            }

            let q = query(pricesRef);
            searchKeywords.forEach(keyword => {
                q = query(q, where("keywords", "array-contains", keyword));
            });
            q = query(q, limit(50));
            
            const querySnapshot = await getDocs(q);
            const priceData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fechaUltimaActualizacion: doc.data().fechaUltimaActualizacion?.toDate ? format(doc.data().fechaUltimaActualizacion.toDate(), "dd/MM/yyyy HH:mm") : 'N/A',
            })) as PriceMasterItem[];
            setPrices(priceData);
        } catch (error) {
            console.error("Error searching prices:", error);
            toast({ variant: "destructive", title: "Error en la búsqueda", description: (error as Error).message });
        } finally {
            setIsSearching(false);
        }
    }, [toast]);
    
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            handleSearch(searchTerm);
        }, 300); // 300ms delay

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, handleSearch]);

    const handleDeleteAll = async () => {
      const pricesRef = collection(db, "preciosMaestros");
      try {
          const querySnapshot = await getDocs(pricesRef);
          const batch = writeBatch(db);
          querySnapshot.forEach(doc => {
              batch.delete(doc.ref);
          });
          await batch.commit();
          toast({ title: "Base de precios eliminada", description: "Se han borrado todos los precios." });
          setPrices([]); // Clear frontend
      } catch (error) {
          console.error("Error deleting all prices:", error);
          toast({ variant: "destructive", title: "Error al borrar", description: `No se pudieron eliminar todos los precios. ${(error as Error).message}`});
      }
    };
  
    const handleDeleteItem = async (id: string) => {
      try {
          await deleteDoc(doc(db, "preciosMaestros", id));
          toast({ title: "Precio eliminado", description: "La partida ha sido eliminada." });
          setPrices(prev => prev.filter(p => p.id !== id));
      } catch (error) {
          console.error(`Error deleting price ${id}:`, error);
          toast({ variant: "destructive", title: "Error al eliminar", description: `No se pudo eliminar la partida. ${(error as Error).message}`});
      }
    };
    
    const handleSetCurrentPrice = async (itemId: string, newPrice: number) => {
        const itemDocRef = doc(db, "preciosMaestros", itemId);
        try {
            await updateDoc(itemDocRef, {
                precioActual: newPrice
            });
            toast({ title: "Precio Actualizado", description: `El precio de la partida ha sido restaurado.`});
            setViewingHistory(null);
        } catch(error) {
            console.error("Error setting current price:", error);
            toast({ variant: "destructive", title: "Error al actualizar", description: `No se pudo cambiar el precio. ${(error as Error).message}`});
        }
    };
    
    return (
      <>
        <Dialog open={!!viewingDescription} onOpenChange={() => setViewingDescription(null)}>
          <DialogContent>
              <DialogHeader><DialogTitle>Descripción Completa</DialogTitle></DialogHeader>
              <ScrollArea className="max-h-[60vh] my-4"><div className="whitespace-pre-wrap break-words pr-4">{viewingDescription}</div></ScrollArea>
              <DialogFooter><Button variant="outline" onClick={() => setViewingDescription(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!viewingOrigin} onOpenChange={() => setViewingOrigin(null)}>
          <DialogContent>
              <DialogHeader><DialogTitle>Origen del Archivo</DialogTitle></DialogHeader>
              <div className="py-4 whitespace-pre-wrap break-words">{viewingOrigin}</div>
              <DialogFooter><Button variant="outline" onClick={() => setViewingOrigin(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <HistoryDialog
            item={viewingHistory}
            open={!!viewingHistory}
            onOpenChange={() => setViewingHistory(null)}
            onSetCurrentPrice={handleSetCurrentPrice}
        />
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Consulta de Precios</CardTitle>
                        <CardDescription>Busca en la base de datos de precios centralizada.</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Borrar Base de Precios
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente
                                    toda la base de precios.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll}>Sí, borrar todo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Input
                        placeholder="Buscar por descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <PriceTable 
                    prices={prices}
                    isSearching={isSearching}
                    hasSearchTerm={!!searchTerm}
                    onViewDescription={setViewingDescription} 
                    onViewOrigin={setViewingOrigin} 
                    onDeleteItem={handleDeleteItem}
                    onViewHistory={setViewingHistory}
                />
            </CardContent>
        </Card>
      </>
    );
}

// --- Componente de Tabla de Precios ---
function PriceTable({ 
    prices, 
    isSearching,
    hasSearchTerm,
    onViewDescription, 
    onViewOrigin, 
    onDeleteItem,
    onViewHistory,
}: { 
    prices: PriceMasterItem[], 
    isSearching: boolean,
    hasSearchTerm: boolean,
    onViewDescription: (description: string) => void, 
    onViewOrigin: (origin: string) => void, 
    onDeleteItem: (id: string) => void,
    onViewHistory: (item: PriceMasterItem) => void,
}) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  const sortedPrices = useMemo(() => {
    let sortableItems = [...prices];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [prices, sortConfig]);

  const requestSort = (key: keyof PriceMasterItem) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof PriceMasterItem) => {
      if (!sortConfig || sortConfig.key !== key) {
          return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      }
      return sortConfig.direction === 'ascending' ? 
          <ArrowUpDown className="h-4 w-4 ml-2" /> : 
          <ArrowUpDown className="h-4 w-4 ml-2 transform rotate-180" />;
  };

  const renderTableBody = () => {
    if (isSearching) {
        return (
            <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin inline" />
                    Buscando...
                </TableCell>
            </TableRow>
        );
    }

    if (sortedPrices.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                    {hasSearchTerm ? "No se encontraron precios para tu búsqueda." : "Escribe en el buscador para encontrar precios."}
                </TableCell>
            </TableRow>
        );
    }
    
    return sortedPrices.map((item) => (
        <TableRow key={item.id}>
            <TableCell className="font-semibold">{item.capitulo}</TableCell>
            <TableCell>
                <div className="max-w-xs truncate cursor-pointer hover:underline" onClick={() => onViewDescription(item.descripcion)}>
                    {item.descripcion}
                </div>
            </TableCell>
            <TableCell>{item.unidad}</TableCell>
            <TableCell>€{item.precioActual?.toFixed(2)}</TableCell>
            <TableCell>{item.fechaUltimaActualizacion}</TableCell>
            <TableCell>
                {(item.historialPrecios?.length || 0) > 1 ? (
                    <Button variant="outline" size="sm" onClick={() => onViewHistory(item)}>
                        <History className="mr-2 h-4 w-4" />
                        Ver ({(item.historialPrecios?.length)})
                    </Button>
                ) : (
                <Badge variant="secondary">Nuevo</Badge>
                )}
            </TableCell>
            <TableCell>
                <div className="max-w-[150px] truncate cursor-pointer hover:underline" onClick={() => onViewOrigin(item.historialPrecios?.[item.historialPrecios.length-1]?.archivoOrigen)}>
                    {item.historialPrecios?.[item.historialPrecios.length-1]?.archivoOrigen}
                </div>
            </TableCell>
            <TableCell>
                {item.status === 'new' && <Badge variant="default" className="bg-green-500 hover:bg-green-600">Nuevo</Badge>}
                {item.status === 'updated' && <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Actualizado</Badge>}
                {!item.status && <Badge variant="secondary">N/A</Badge>}
            </TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Seguro que quieres eliminar esta partida?</AlertDialogTitle>
                            <AlertDialogDescription>
                                "{item.descripcion}" y todo su historial de precios serán eliminados permanentemente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteItem(item.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    ));
  };

  return (
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead onClick={() => requestSort("capitulo")} className="cursor-pointer">
                    <div className="flex items-center">Capítulo {getSortIcon("capitulo")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("descripcion")} className="cursor-pointer">
                    <div className="flex items-center">Descripción {getSortIcon("descripcion")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("unidad")} className="cursor-pointer">
                    <div className="flex items-center">Unidad {getSortIcon("unidad")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("precioActual")} className="cursor-pointer">
                    <div className="flex items-center">Precio Unitario {getSortIcon("precioActual")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("fechaUltimaActualizacion")} className="cursor-pointer">
                    <div className="flex items-center">Fecha Act. {getSortIcon("fechaUltimaActualizacion")}</div>
                </TableHead>
                <TableHead>Historial</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
                {renderTableBody()}
            </TableBody>
        </Table>
        </div>
  );
}

function HistoryDialog({
    item,
    open,
    onOpenChange,
    onSetCurrentPrice
}: {
    item: PriceMasterItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSetCurrentPrice: (itemId: string, newPrice: number) => void;
}) {
    if (!item) return null;

    const sortedHistory = [...(item.historialPrecios || [])].sort((a,b) => {
        const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
        const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Historial de Precios</DialogTitle>
                    <DialogDescription>{item.descripcion}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Precio</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedHistory.map((entry, index) => (
                                <TableRow key={index} className={entry.precio === item.precioActual ? "bg-primary/10" : ""}>
                                    <TableCell>€{entry.precio.toFixed(2)}</TableCell>
                                    <TableCell>{entry.fecha?.toDate ? format(entry.fecha.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                    <TableCell>{entry.archivoOrigen}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => onSetCurrentPrice(item.id, entry.precio)}
                                            disabled={entry.precio === item.precioActual}
                                        >
                                            <Undo className="mr-2 h-4 w-4" /> Usar este precio
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ReportDisplay({ report, onUpdateReport }: { report: FormsReport, onUpdateReport: (report: FormsReport) => void }) {
    const [editingContact, setEditingContact] = useState<any | null>(null);

    const getPriorityVariant = (priority: 'Alta' | 'Media' | 'Baja') => {
        switch (priority) {
            case 'Alta': return 'destructive';
            case 'Media': return 'default';
            case 'Baja': return 'secondary';
            default: return 'outline';
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
                {title === 'Obra Nueva' ? <Building/> : <Users/>} {title}
            </h3>
            {data && data.length > 0 ? (
                <Accordion type="multiple" className="w-full" defaultValue={data.map(city => city.ciudad)}>
                    {data.map((cityGroup, index) => (
                        <AccordionItem value={cityGroup.ciudad} key={`${title}-${cityGroup.ciudad}-${index}`}>
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
            {renderCategory('Obra Nueva', report?.obraNueva)}
            {renderCategory('Reformas', report?.reformas)}
        </div>
    )
}

function AiReportGenerator({ forms, onReportGenerated }: { forms: any[], onReportGenerated: (report: FormsReport) => void }) {
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
        
        try {
            const formsJson = JSON.stringify(forms);
            const result = await createFormsReport({ formsJson });
            const reportDocRef = doc(db, 'ia_reports', 'latest');
            await setDoc(reportDocRef, JSON.parse(JSON.stringify(result)));
            onReportGenerated(result);
            toast({
                title: 'Reporte Generado y Guardado',
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
                <CardTitle>Generador de Reporte con IA</CardTitle>
                <CardDescription>
                    Analiza los contactos de "Formularios Externos" para clasificarlos, agruparlos y priorizarlos. El reporte se guarda y se muestra en la pestaña "Reporte IA".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <BrainCircuit className="mr-2 h-4 w-4" /> )}
                    {isLoading ? 'Analizando...' : 'Generar Reporte con IA'}
                </Button>
            </CardContent>
        </Card>
    )
}


function AiReportViewer() {
    const [report, setReport] = useState<FormsReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const reportDocRef = useMemo(() => doc(db, 'ia_reports', 'latest'), []);

     useEffect(() => {
        const unsubscribe = onSnapshot(reportDocRef, (doc) => {
            if (doc.exists()) {
                setReport(doc.data() as FormsReport);
            } else {
                setReport(null);
            }
            setIsLoading(false);
        }, (error) => {
             console.error("Error fetching report from snapshot: ", error);
             toast({ variant: 'destructive', title: 'Error de Sincronización', description: 'No se pudo actualizar el reporte en tiempo real.'});
             setIsLoading(false);
        });

        return () => unsubscribe();
    }, [reportDocRef, toast]);
    
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
            await setDoc(reportDocRef, updatedReport, { merge: true });
            toast({ title: 'Notas guardadas', description: 'Tus notas se han actualizado en el reporte.' });
        } catch (error) {
            console.error("Error updating report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar las notas.' });
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Visor de Reporte IA</CardTitle>
                        <CardDescription>
                            Aquí puedes ver el último reporte generado. Se actualiza en tiempo real.
                        </CardDescription>
                    </div>
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
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Cargando último reporte...</p>
                    </div>
                )}
                
                {report && !isLoading ? (
                   <ReportDisplay report={report} onUpdateReport={handleUpdateReport} />
                ) : (
                   !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg mt-6">
                            <AlertCircle className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No hay ningún reporte generado</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ve a la pestaña "Generador de Reportes" para crear uno.
                            </p>
                        </div>
                   )
                )}

            </CardContent>
        </Card>
    );
}


// --- Sección Principal de IA ---
export function AiSection({
    companies,
    forms,
    onCreateBudgetFromAi
}: {
    companies: Company[],
    forms: any[],
    onCreateBudgetFromAi: (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas') => void;
}) {
    const { toast } = useToast();
    const [latestReport, setLatestReport] = useState<FormsReport | null>(null);
    const [activeTab, setActiveTab] = useState('budgets');
    const [subTab, setSubTab] = useState('upload-for-prices');
    const [viewEditSubTab, setViewEditSubTab] = useState('ai-budgets');
    const [reportsSubTab, setReportsSubTab] = useState('generator');
    
    useEffect(() => {
        const savedTab = localStorage.getItem('aiSection_activeTab');
        const savedSubTab = localStorage.getItem('aiSection_subTab');
        const savedViewEditSubTab = localStorage.getItem('aiSection_viewEditSubTab');
        const savedReportsSubTab = localStorage.getItem('aiSection_reportsSubTab');

        if (savedTab) setActiveTab(savedTab);
        if (savedSubTab) setSubTab(savedSubTab);
        if (savedViewEditSubTab) setViewEditSubTab(savedViewEditSubTab);
        if (savedReportsSubTab) setReportsSubTab(savedReportsSubTab);
    }, []);

    const handleTabChange = (value: string, type: 'main' | 'sub' | 'viewEdit' | 'reports') => {
        switch (type) {
            case 'main':
                setActiveTab(value);
                localStorage.setItem('aiSection_activeTab', value);
                break;
            case 'sub':
                setSubTab(value);
                localStorage.setItem('aiSection_subTab', value);
                break;
            case 'viewEdit':
                setViewEditSubTab(value);
                localStorage.setItem('aiSection_viewEditSubTab', value);
                break;
            case 'reports':
                setReportsSubTab(value);
                localStorage.setItem('aiSection_reportsSubTab', value);
                break;
        }
    };


    const handleSaveToPriceBase = useCallback(async (breakdown: ProjectBreakdown, fileName: string) => {
      const pricesRef = collection(db, "preciosMaestros");
      const batch = writeBatch(db);
      const now = new Date();

      for (const capitulo of breakdown.capitulos) {
        for (const partida of capitulo.partidas) {
          if (!partida.precioUnitario || isNaN(parseFloat(partida.precioUnitario.replace(',', '.')))) continue;
          
          const q = query(pricesRef, where("descripcion", "==", partida.descripcion));
          const querySnapshot = await getDocs(q);
          
          const precio = parseFloat(partida.precioUnitario.replace(',', '.'));
          const newHistoryEntry = { precio, fecha: now, archivoOrigen: fileName };
          
          // Improved keyword generation
          const keywords = partida.descripcion
            .toLowerCase()
            .replace(/[.,;:]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/) // Split by any whitespace
            .filter(Boolean); // Remove empty strings

          if (querySnapshot.empty) {
            const newDocRef = doc(pricesRef);
            batch.set(newDocRef, {
                capitulo: capitulo.nombre,
                descripcion: partida.descripcion,
                unidad: partida.unidad,
                precioActual: precio,
                fechaUltimaActualizacion: now,
                historialPrecios: [newHistoryEntry],
                status: 'new',
                keywords: keywords
            });
          } else {
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(pricesRef, docId);
            const existingData = querySnapshot.docs[0].data();
            const newHistory = [...(existingData.historialPrecios || []), newHistoryEntry];
            batch.update(docRef, {
               precioActual: precio,
               fechaUltimaActualizacion: now,
               historialPrecios: newHistory,
               status: 'updated',
               keywords: keywords
            });
          }
        }
      }
      
      try {
        await batch.commit();
        toast({ title: "Base de Precios Actualizada", description: "Los precios del desglose se han añadido/actualizado."});
      } catch (error) {
         toast({ variant: "destructive", title: "Error al actualizar precios", description: `No se pudo guardar en la base de precios. ${(error as Error).message}` });
         throw error; // Propagate error for the caller to handle state
      }
    }, [toast]);

    const handleSaveToAiBudgets = useCallback(async (breakdown: ProjectBreakdown, fileName: string) => {
        try {
            await addDoc(collection(db, "ia_budgets"), {
                fileName: fileName,
                title: fileName,
                createdAt: new Date(),
                breakdown: JSON.parse(JSON.stringify(breakdown)), // Deep copy to prevent issues
                userLineTotals: {},
                clientName: "",
                description: ""
            });
            toast({ title: "Presupuesto Guardado", description: "El desglose ha sido guardado en la sección de Presupuestos IA." });
        } catch (error) {
            console.error("Error saving AI budget:", error);
            toast({ variant: "destructive", title: "Error al guardar", description: `No se pudo guardar el presupuesto. ${(error as Error).message}` });
            throw error; // Propagate error
        }
    }, [toast]);
    
    return (
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v, 'main')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="budgets"><BrainCircuit className="mr-2" />Presupuestos y Precios</TabsTrigger>
                <TabsTrigger value="reports"><BrainCircuit className="mr-2" />Reportes de Formularios</TabsTrigger>
            </TabsList>
            <TabsContent value="budgets" className="mt-6">
                <Tabs value={subTab} onValueChange={(v) => handleTabChange(v, 'sub')} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload-for-prices">
                        <Database className="mr-2" /> Subir para Precios
                        </TabsTrigger>
                        <TabsTrigger value="upload-for-budgets">
                        <Server className="mr-2" /> Subir para Presupuestos IA
                        </TabsTrigger>
                        <TabsTrigger value="view-and-edit">
                        <BrainCircuit className="mr-2" /> Consulta y Edición
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload-for-prices" className="mt-6">
                        <BudgetUploader 
                            title="Subir para Base de Precios"
                            description="Sube un PDF para añadir o actualizar partidas en tu base de datos de precios centralizada."
                            onAnalysisComplete={handleSaveToPriceBase}
                            saveButtonLabel="Añadir a Base de Precios"
                            saveButtonIcon={<Database className="mr-2 h-4 w-4" />}
                        />
                    </TabsContent>

                    <TabsContent value="upload-for-budgets" className="mt-6">
                        <BudgetUploader 
                            title="Subir para Presupuestos IA"
                            description="Sube un PDF para crear una nueva tarjeta de presupuesto editable en la sección 'Presupuestos IA'."
                            onAnalysisComplete={handleSaveToAiBudgets}
                            saveButtonLabel="Guardar Presupuesto"
                            saveButtonIcon={<Save className="mr-2 h-4 w-4" />}
                        />
                    </TabsContent>

                    <TabsContent value="view-and-edit" className="mt-6">
                        <Tabs value={viewEditSubTab} onValueChange={(v) => handleTabChange(v, 'viewEdit')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="ai-budgets"><Server className="mr-2" />Presupuestos IA</TabsTrigger>
                                <TabsTrigger value="price-database"><Database className="mr-2" />Base de Precios</TabsTrigger>
                            </TabsList>
                            <TabsContent value="ai-budgets" className="mt-6">
                            <AiBudgetsSection companies={companies} onCreateBudgetFromAi={onCreateBudgetFromAi} />
                            </TabsContent>
                            <TabsContent value="price-database" className="mt-6">
                                <PriceDatabaseSection />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="reports" className="mt-6">
                <Tabs value={reportsSubTab} onValueChange={(v) => handleTabChange(v, 'reports')} className="w-full">
                     <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="generator">Generador de Reportes</TabsTrigger>
                        <TabsTrigger value="viewer">Visor de Reporte IA</TabsTrigger>
                    </TabsList>
                    <TabsContent value="generator" className="mt-6">
                        <AiReportGenerator forms={forms} onReportGenerated={setLatestReport} />
                    </TabsContent>
                    <TabsContent value="viewer" className="mt-6">
                        <AiReportViewer />
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    );
}
