

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from "@/components/ui/table";
import { UploadCloud, FileText, X, Loader2, Save, Trash2, PlusCircle, Copy, Pencil, Printer, Merge, FolderPlus, MoreHorizontal, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectBreakdown } from "@/ai/flows/create-project-breakdown";
import { createProjectBreakdown } from "@/ai/flows/create-project-breakdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogHeader, DialogFooter, DialogClose, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "../../ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "../../ui/dropdown-menu";
import { AiBudgetPrintLayout } from "../budget-print-layout";
import type { Company } from "../company/company-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { format } from "date-fns";


// --- Tipos de Datos ---
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
  category: z.enum(["obra_nueva", "reformas", "enviados", "subcontratas"], {
    required_error: "Debes seleccionar una categoría.",
  }),
});

const addChapterSchema = z.object({
    chapterName: z.string().min(1, "El nombre del capítulo es requerido."),
});

const addLineItemSchema = z.object({
    numero: z.string().optional(),
    description: z.string().min(1, "La descripción es requerida."),
    medicion: z.string().optional(),
    unidad: z.string().optional(),
    total: z.coerce.number().min(0, "El total debe ser un número positivo.").optional(),
});

const manualChapterSchema = z.object({
    chapterName: z.string().min(1, "El nombre del capítulo es requerido."),
});


// --- Componente para Generador de Desglose ---
export function BudgetUploader({ 
    onAnalysisComplete,
}: { 
    onAnalysisComplete: (breakdown: ProjectBreakdown, fileName: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [breakdown, setBreakdown] = useState<ProjectBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isManualChapterDialogOpen, setManualChapterDialogOpen] = useState(false);
  const { toast } = useToast();

  const manualChapterForm = useForm<z.infer<typeof manualChapterSchema>>({
    resolver: zodResolver(manualChapterSchema),
    defaultValues: { chapterName: "" },
  });


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
  
  const processFileAndAnalyze = async (chapterName?: string) => {
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
          const result = await createProjectBreakdown({ pdfDataUri: dataUri, chapterName });
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
  }

  const handleGenerate = () => {
    processFileAndAnalyze();
  };
  
  const handleManualChapterSubmit = (values: z.infer<typeof manualChapterSchema>) => {
    setManualChapterDialogOpen(false);
    processFileAndAnalyze(values.chapterName);
    manualChapterForm.reset();
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
    <>
      <Dialog open={isManualChapterDialogOpen} onOpenChange={setManualChapterDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir a Capítulo Manualmente</DialogTitle>
                <DialogDescription>Introduce el nombre del capítulo al que pertenecerán las partidas de este PDF.</DialogDescription>
            </DialogHeader>
            <Form {...manualChapterForm}>
                <form onSubmit={manualChapterForm.handleSubmit(handleManualChapterSubmit)} className="space-y-4">
                    <FormField
                        control={manualChapterForm.control}
                        name="chapterName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Capítulo</FormLabel>
                                <FormControl>
                                    <Input {...field} autoFocus />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button type="submit">Analizar y Añadir</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subir para Presupuestos IA</CardTitle>
            <CardDescription>Sube un PDF para crear una nueva tarjeta de presupuesto editable en la sección 'Presupuestos IA'.</CardDescription>
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
          <CardFooter className="flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={!file || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Analizando..." : "Analizar con IA"}
            </Button>
            <Button variant="outline" onClick={() => setManualChapterDialogOpen(true)} disabled={!file || isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir con IA
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
                            <TableHead>Nº</TableHead>
                            <TableHead>Partida</TableHead>
                            <TableHead className="text-right">Medición</TableHead>
                            <TableHead className="text-center">Unidad</TableHead>
                            <TableHead className="text-right">Precio/Ud.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {capitulo.partidas.map((partida, pIndex) => (
                            <TableRow key={pIndex}>
                              <TableCell className="w-[80px]">{partida.numero}</TableCell>
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
            <CardFooter>
              <Button onClick={handleSaveClick} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar Presupuesto
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
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
    onConfirm: (category: 'obra_nueva' | 'reformas' | 'enviados' | 'subcontratas') => void;
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
                                    className="grid grid-cols-2 gap-4"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="obra_nueva" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Obra Nueva</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="reformas" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Reformas</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="enviados" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Enviados</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="subcontratas" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Subcontratas</FormLabel>
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

function AddChapterDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (chapterName: string) => void }) {
    const form = useForm<z.infer<typeof addChapterSchema>>({
        resolver: zodResolver(addChapterSchema),
        defaultValues: { chapterName: "" },
    });

    const handleSubmit = (values: z.infer<typeof addChapterSchema>) => {
        onSave(values.chapterName);
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Añadir Nuevo Capítulo</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="chapterName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Capítulo</FormLabel>
                                    <FormControl><Input {...field} autoFocus /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">Añadir Capítulo</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function AddLineItemDialog({ open, onOpenChange, onSave, chapterName }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (values: z.infer<typeof addLineItemSchema>) => void, chapterName: string }) {
    const form = useForm<z.infer<typeof addLineItemSchema>>({
        resolver: zodResolver(addLineItemSchema),
        defaultValues: { numero: "", description: "", medicion: "1", unidad: "ud", total: 0 },
    });

    const handleSubmit = (values: z.infer<typeof addLineItemSchema>) => {
        onSave(values);
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Partida a "{chapterName}"</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                         <FormField control={form.control} name="numero" render={({ field }) => (
                            <FormItem><FormLabel>Nº Partida</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} autoFocus /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="medicion" render={({ field }) => (
                                <FormItem><FormLabel>Medición</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="unidad" render={({ field }) => (
                                <FormItem><FormLabel>Unidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="total" render={({ field }) => (
                                <FormItem><FormLabel>Total (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">Añadir Partida</Button>
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
    onChapterNameChange,
    onAddChapter,
    onAddLineItem,
    onPartidaChange,
    onCreateSummaryBudgetFromAi,
    onMovePartida,
}: { 
    budget: AiBudgetItem, 
    onLineTotalChange: (budgetId: string, capitulo: string, partida: string, total: string) => void,
    onDetailsChange: (id: string, values: z.infer<typeof budgetDetailsSchema>) => void,
    onDelete: (id: string) => void,
    onPrint: (budget: AiBudgetItem, printOptions: { summaryOnly: boolean }) => void,
    onMergeClick: (budget: AiBudgetItem) => void,
    onAddToBudgetClick: (budget: AiBudgetItem) => void,
    onChapterNameChange: (budgetId: string, oldName: string, newName: string) => void,
    onAddChapter: (budgetId: string, chapterName: string) => void,
    onAddLineItem: (budgetId: string, chapterName: string, values: z.infer<typeof addLineItemSchema>) => void,
    onPartidaChange: (budgetId: string, chapterName: string, partidaIndex: number, field: 'numero' | 'descripcion' | 'medicion' | 'unidad', value: string) => void,
    onCreateSummaryBudgetFromAi: (aiBudget: AiBudgetItem) => void,
    onMovePartida: (budgetId: string, sourceChapterName: string, partidaIndex: number, targetChapterName: string) => void,
}) {
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<{ oldName: string; newName: string } | null>(null);
    const [isAddChapterOpen, setAddChapterOpen] = useState(false);
    const [addingLineItemTo, setAddingLineItemTo] = useState<string | null>(null);

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
             {isAddChapterOpen && (
                <AddChapterDialog
                    open={isAddChapterOpen}
                    onOpenChange={setAddChapterOpen}
                    onSave={(name) => onAddChapter(budget.id, name)}
                />
            )}
            {addingLineItemTo && (
                <AddLineItemDialog
                    open={!!addingLineItemTo}
                    onOpenChange={() => setAddingLineItemTo(null)}
                    chapterName={addingLineItemTo}
                    onSave={(values) => onAddLineItem(budget.id, addingLineItemTo, values)}
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
                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onSelect={() => onPrint(budget, { summaryOnly: false })}>Imprimir Completo</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onPrint(budget, { summaryOnly: true })}>Imprimir Resumen</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
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
                                    <div className="flex items-center gap-2">
                                        <AccordionTrigger className="text-lg font-semibold flex-1">
                                            {editingChapter?.oldName === capitulo.nombre ? (
                                                <Input 
                                                    value={editingChapter.newName}
                                                    onChange={(e) => setEditingChapter({ ...editingChapter, newName: e.target.value })}
                                                    onKeyDown={handleChapterNameKeyDown}
                                                    onBlur={() => setEditingChapter(null)}
                                                    autoFocus
                                                    className="h-8"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span>{capitulo.nombre}</span>
                                            )}
                                        </AccordionTrigger>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 shrink-0" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setEditingChapter({ oldName: capitulo.nombre, newName: capitulo.nombre }); 
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">Nº Partida</TableHead>
                                                    <TableHead className="w-2/5">Partida</TableHead>
                                                    <TableHead className="text-right">Medición</TableHead>
                                                    <TableHead className="text-center">Unidad</TableHead>
                                                    <TableHead className="text-right">Tu Precio (€/ud)</TableHead>
                                                    <TableHead className="text-right">Total Partida (€)</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {capitulo.partidas.map((partida, pIndex) => {
                                                    const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                                                    const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                                                    const userPrice = quantity !== 0 ? lineTotal / quantity : 0;
                                                    return (
                                                    <TableRow key={pIndex}>
                                                        <TableCell className="w-[80px]">
                                                            <Input
                                                                defaultValue={partida.numero || ''}
                                                                className="text-left h-8"
                                                                onBlur={(e) => onPartidaChange(budget.id, capitulo.nombre, pIndex, 'numero', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="w-2/5">
                                                            <Textarea
                                                                defaultValue={partida.descripcion}
                                                                className="w-full h-auto"
                                                                onBlur={(e) => onPartidaChange(budget.id, capitulo.nombre, pIndex, 'descripcion', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right w-[100px]">
                                                            <Input
                                                                defaultValue={partida.medicion || ''}
                                                                className="text-right h-8"
                                                                onBlur={(e) => onPartidaChange(budget.id, capitulo.nombre, pIndex, 'medicion', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center w-[100px]">
                                                            <Input
                                                                defaultValue={partida.unidad || ''}
                                                                className="text-center h-8"
                                                                onBlur={(e) => onPartidaChange(budget.id, capitulo.nombre, pIndex, 'unidad', e.target.value)}
                                                            />
                                                        </TableCell>
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
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuSub>
                                                                        <DropdownMenuSubTrigger>
                                                                            <Move className="mr-2 h-4 w-4" /> Mover a...
                                                                        </DropdownMenuSubTrigger>
                                                                        <DropdownMenuSubContent>
                                                                            {budget.breakdown.capitulos.filter(c => c.nombre !== capitulo.nombre).map(targetChapter => (
                                                                                <DropdownMenuItem key={targetChapter.nombre} onSelect={() => onMovePartida(budget.id, capitulo.nombre, pIndex, targetChapter.nombre)}>
                                                                                    {targetChapter.nombre}
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </DropdownMenuSubContent>
                                                                    </DropdownMenuSub>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                )})}
                                            </TableBody>
                                            <UiTableFooter>
                                                <TableRow className="bg-secondary/50 hover:bg-secondary">
                                                    <TableCell colSpan={6} className="text-right font-bold">Total Capítulo</TableCell>
                                                    <TableCell className="text-right font-bold font-mono">
                                                        €{(budgetTotals.chapterTotals[capitulo.nombre] || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            </UiTableFooter>
                                        </Table>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => setAddingLineItemTo(capitulo.nombre)}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Partida
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <Button variant="outline" className="mt-4" onClick={() => setAddChapterOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Capítulo
                        </Button>

                        <Accordion type="single" collapsible className="w-full mt-6">
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
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => onCreateSummaryBudgetFromAi(budget)}
                                    >
                                        <Copy className="mr-2 h-4 w-4" /> Mover Resumen a Presupuestos
                                    </Button>
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
export function AiBudgetsSection({ 
    aiBudgets,
    onUpdateAiBudget,
    onDeleteAiBudget,
    companies,
    onCreateBudgetFromAi,
    onCreateSummaryBudgetFromAi,
    onMovePartida,
}: { 
    aiBudgets: AiBudgetItem[],
    onUpdateAiBudget: (budget: any) => void,
    onDeleteAiBudget: (id: string) => void,
    companies: Company[],
    onCreateBudgetFromAi: (aiBudget: AiBudgetItem, category: 'obra_nueva' | 'reformas' | 'enviados' | 'subcontratas') => void;
    onCreateSummaryBudgetFromAi: (aiBudget: AiBudgetItem) => void;
    onMovePartida: (budgetId: string, sourceChapterName: string, partidaIndex: number, targetChapterName: string) => void;
}) {
    const { toast } = useToast();
    const [printingBudget, setPrintingBudget] = useState<{ budget: AiBudgetItem, printOptions: { summaryOnly: boolean } } | null>(null);
    const [mergingBudget, setMergingBudget] = useState<AiBudgetItem | null>(null);
    const [addingToBudget, setAddingToBudget] = useState<AiBudgetItem | null>(null);

    useEffect(() => {
        if (printingBudget) {
            const timer = setTimeout(() => {
                window.print();
                setPrintingBudget(null);
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [printingBudget]);

    const handleLineTotalChange = (budgetId: string, capitulo: string, partida: string, total: string) => {
        const budget = aiBudgets.find(b => b.id === budgetId);
        if(!budget) return;
        const totalValue = parseFloat(total);
        const newTotal = isNaN(totalValue) ? 0 : totalValue;
        const updatedTotals = {
            ...budget.userLineTotals,
            [capitulo]: {
                ...(budget.userLineTotals?.[capitulo] || {}),
                [partida]: newTotal
            }
        };
        onUpdateAiBudget({ id: budgetId, userLineTotals: updatedTotals });
    };
    
    const handleDetailsChange = (id: string, values: z.infer<typeof budgetDetailsSchema>) => {
        onUpdateAiBudget({ id, ...values });
    };

    const handleMergeBudgets = async (sourceId: string, targetId: string) => {
        const sourceBudget = aiBudgets.find(b => b.id === sourceId);
        const targetBudget = aiBudgets.find(b => b.id === targetId);

        if (!sourceBudget || !targetBudget) {
            toast({ variant: "destructive", title: "Error", description: "No se encontraron los presupuestos para unir." });
            return;
        }

        const mergedBreakdown = [...targetBudget.breakdown.capitulos];
        const mergedTotals = { ...targetBudget.userLineTotals };

        for (const sourceChapter of sourceBudget.breakdown.capitulos) {
            const targetChapter = mergedBreakdown.find(c => c.nombre === sourceChapter.nombre);
            if (targetChapter) {
                targetChapter.partidas.push(...sourceChapter.partidas);
            } else {
                mergedBreakdown.push(sourceChapter);
            }
        }
        
        for (const [chapterName, partidas] of Object.entries(sourceBudget.userLineTotals || {})) {
            if (!mergedTotals[chapterName]) {
                mergedTotals[chapterName] = {};
            }
             Object.assign(mergedTotals[chapterName], partidas);
        }
        
        onUpdateAiBudget({ id: targetId, breakdown: { capitulos: mergedBreakdown }, userLineTotals: mergedTotals });
        onDeleteAiBudget(sourceId);
        
        toast({ title: "Fusión completada", description: `"${sourceBudget.title}" se ha unido con "${targetBudget.title}".` });
    };
    
    const handleChapterNameChange = (budgetId: string, oldName: string, newName: string) => {
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

        onUpdateAiBudget({ id: budgetId, breakdown: newBreakdown, userLineTotals: newUserLineTotals });
    };

    const handleAddChapter = (budgetId: string, chapterName: string) => {
        const budget = aiBudgets.find(b => b.id === budgetId);
        if (!budget) return;
        
        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        if(newBreakdown.capitulos.some((c:any) => c.nombre === chapterName)) {
            toast({ variant: "destructive", title: "Capítulo duplicado", description: "Ya existe un capítulo con ese nombre." });
            return;
        }

        newBreakdown.capitulos.push({ nombre: chapterName, partidas: [] });
        onUpdateAiBudget({ id: budgetId, breakdown: newBreakdown });
    };

    const handleAddLineItem = (budgetId: string, chapterName: string, values: z.infer<typeof addLineItemSchema>) => {
        const budget = aiBudgets.find(b => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const chapter = newBreakdown.capitulos.find((c: any) => c.nombre === chapterName);
        if (!chapter) return;
        
        chapter.partidas.push({
            numero: values.numero || "",
            description: values.description,
            medicion: values.medicion || "",
            unidad: values.unidad || "",
            precioUnitario: "", // Not used for user-added items
        });

        const newTotal = values.total || 0;
        const updatedTotals = {
            ...budget.userLineTotals,
            [chapterName]: {
                ...(budget.userLineTotals?.[chapterName] || {}),
                [values.description]: newTotal,
            }
        };

        onUpdateAiBudget({ id: budgetId, breakdown: newBreakdown, userLineTotals: updatedTotals });
    };
    
    const handlePartidaChange = (budgetId: string, chapterName: string, partidaIndex: number, field: 'numero' | 'descripcion' | 'medicion' | 'unidad', value: string) => {
        const budget = aiBudgets.find(b => b.id === budgetId);
        if (!budget) return;

        const newBreakdown = JSON.parse(JSON.stringify(budget.breakdown));
        const chapter = newBreakdown.capitulos.find((c: any) => c.nombre === chapterName);
        if (!chapter || !chapter.partidas[partidaIndex]) return;

        if (field === 'descripcion') {
            const oldDescription = chapter.partidas[partidaIndex].descripcion;
            const newUserLineTotals = JSON.parse(JSON.stringify(budget.userLineTotals || {}));

            if (newUserLineTotals[chapterName] && newUserLineTotals[chapterName][oldDescription] !== undefined) {
                newUserLineTotals[chapterName][value] = newUserLineTotals[chapterName][oldDescription];
                delete newUserLineTotals[chapterName][oldDescription];
                onUpdateAiBudget({id: budgetId, userLineTotals: newUserLineTotals});
            }
        }

        chapter.partidas[partidaIndex][field] = value;
        onUpdateAiBudget({ id: budgetId, breakdown: newBreakdown });
    };
    
    const handlePrint = (budget: AiBudgetItem, printOptions: { summaryOnly: boolean }) => {
        setPrintingBudget({ budget, printOptions });
    };

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
                    budget={printingBudget?.budget || null}
                    company={companies.length > 0 ? companies[0] : null}
                    printOptions={printingBudget?.printOptions}
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
                        onDelete={onDeleteAiBudget}
                        onPrint={handlePrint}
                        onMergeClick={setMergingBudget}
                        onAddToBudgetClick={setAddingToBudget}
                        onChapterNameChange={handleChapterNameChange}
                        onAddChapter={handleAddChapter}
                        onAddLineItem={handleAddLineItem}
                        onPartidaChange={handlePartidaChange}
                        onCreateSummaryBudgetFromAi={onCreateSummaryBudgetFromAi}
                        onMovePartida={onMovePartida}
                    />
                ))}
            </Accordion>
          ) : (
             <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <p className="mt-1 text-sm text-muted-foreground">
                    No hay presupuestos analizados. Ve a la pestaña "Subir" para empezar.
                </p>
            </div>
          )}
      </div>
    );
}
