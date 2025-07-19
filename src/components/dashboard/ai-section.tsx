
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from "@/components/ui/table";
import { BrainCircuit, UploadCloud, FileText, CheckCircle, AlertCircle, X, ArrowUpDown, Database, Loader2, Save, Trash2, Search, FileUp, History, Undo, FileInput, Server, Plus, Pencil, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs, writeBatch, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { format } from "date-fns";
import { createProjectBreakdown, type ProjectBreakdown } from "@/ai/flows/create-project-breakdown";
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
import { AiBudgetPrintLayout } from "./budget-print-layout";
import type { Company } from "./company-card";


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
type SortConfig = {
  key: keyof PriceMasterItem;
  direction: "ascending" | "descending";
};

export type AiBudgetItem = {
  id: string;
  fileName: string;
  title: string;
  clientName?: string;
  description?: string;
  createdAt: any; // Firestore Timestamp
  breakdown: ProjectBreakdown;
  userPrices?: Record<string, Record<string, number>>;
};


const budgetDetailsSchema = z.object({
    title: z.string().min(1, "El título es requerido."),
    clientName: z.string().optional(),
    description: z.string().optional(),
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

// --- Componente para una tarjeta de presupuesto de IA ---
function AiBudgetCard({ 
    budget, 
    onUserPriceChange, 
    onDetailsChange,
    onDelete,
    onPrint
}: { 
    budget: AiBudgetItem, 
    onUserPriceChange: (budgetId: string, capitulo: string, partida: string, price: string) => void,
    onDetailsChange: (id: string, values: z.infer<typeof budgetDetailsSchema>) => void,
    onDelete: (id: string) => void,
    onPrint: (budget: AiBudgetItem) => void
}) {
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const budgetTotals = useMemo(() => {
        let grandTotal = 0;
        const chapterTotals: Record<string, number> = {};

        if (budget.breakdown.capitulos) {
            for (const capitulo of budget.breakdown.capitulos) {
                const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                    const price = budget.userPrices?.[capitulo.nombre]?.[partida.descripcion] || 0;
                    const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                    return sum + (price * quantity);
                }, 0);
                chapterTotals[capitulo.nombre] = chapterTotal;
                grandTotal += chapterTotal;
            }
        }
        return { grandTotal, chapterTotals };
    }, [budget.breakdown, budget.userPrices]);

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
                                <DropdownMenuItem onSelect={() => setDetailsDialogOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onPrint(budget)}>
                                    <Printer className="mr-2 h-4 w-4" /> Imprimir
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
                    <CardContent className="flex-grow">
                        <Accordion type="multiple" className="w-full">
                            {budget.breakdown.capitulos.map((capitulo, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-lg font-semibold">{capitulo.nombre}</AccordionTrigger>
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
                                                    const userPrice = budget.userPrices?.[capitulo.nombre]?.[partida.descripcion] || 0;
                                                    const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                                                    const lineTotal = userPrice * quantity;
                                                    return (
                                                    <TableRow key={pIndex}>
                                                        <TableCell>{partida.descripcion}</TableCell>
                                                        <TableCell className="text-right">{partida.medicion}</TableCell>
                                                        <TableCell className="text-center">{partida.unidad}</TableCell>
                                                        <TableCell className="text-right w-[150px]">
                                                            <Input
                                                                type="number"
                                                                className="text-right"
                                                                placeholder="0.00"
                                                                defaultValue={userPrice || ''}
                                                                onBlur={(e) => onUserPriceChange(budget.id, capitulo.nombre, partida.descripcion, e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    companies 
}: { 
    companies: Company[] 
}) {
    const [aiBudgets, setAiBudgets] = useState<AiBudgetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [printingBudget, setPrintingBudget] = useState<AiBudgetItem | null>(null);
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

    const handleUserPriceChange = async (budgetId: string, capitulo: string, partida: string, price: string) => {
        const budgetRef = doc(db, 'ia_budgets', budgetId);
        const priceValue = parseFloat(price);
        const newPrice = isNaN(priceValue) ? 0 : priceValue;

        const currentBudget = aiBudgets.find(b => b.id === budgetId);
        if (!currentBudget) return;
        
        const updatedUserPrices = {
            ...currentBudget.userPrices,
            [capitulo]: {
                ...(currentBudget.userPrices?.[capitulo] || {}),
                [partida]: newPrice
            }
        };

        try {
            await setDoc(budgetRef, {
                userPrices: updatedUserPrices
            }, { merge: true });
        } catch (error) {
            console.error("Error updating user price:", error);
            toast({ variant: 'destructive', title: 'Error al guardar precio', description: 'No se pudo actualizar el precio en la base de datos.'});
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
          <div className="printable-area">
                <AiBudgetPrintLayout 
                    budget={printingBudget}
                    company={companies[0] || null}
                />
            </div>
          {aiBudgets.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
                {aiBudgets.map(budget => (
                    <AiBudgetCard
                        key={budget.id}
                        budget={budget}
                        onUserPriceChange={handleUserPriceChange}
                        onDetailsChange={handleDetailsChange}
                        onDelete={handleDeleteBudget}
                        onPrint={setPrintingBudget}
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
    const [viewingDescription, setViewingDescription] = useState<string | null>(null);
    const [viewingOrigin, setViewingOrigin] = useState<string | null>(null);
    const [viewingHistory, setViewingHistory] = useState<PriceMasterItem | null>(null);


    useEffect(() => {
        const q = query(collection(db, "preciosMaestros"), orderBy("fechaUltimaActualizacion", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const priceData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            fechaUltimaActualizacion: doc.data().fechaUltimaActualizacion?.toDate ? format(doc.data().fechaUltimaActualizacion.toDate(), "dd/MM/yyyy HH:mm") : 'N/A',
          })) as PriceMasterItem[];
          setPrices(priceData);
        });
        return () => unsubscribe();
    }, []);

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
      } catch (error) {
          console.error("Error deleting all prices:", error);
          toast({ variant: "destructive", title: "Error al borrar", description: `No se pudieron eliminar todos los precios. ${(error as Error).message}`});
      }
    };
  
    const handleDeleteItem = async (id: string) => {
      try {
          await deleteDoc(doc(db, "preciosMaestros", id));
          toast({ title: "Precio eliminado", description: "La partida ha sido eliminada." });
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
                <PriceTable 
                    prices={prices} 
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
    onViewDescription, 
    onViewOrigin, 
    onDeleteItem,
    onViewHistory,
}: { 
    prices: PriceMasterItem[], 
    onViewDescription: (description: string) => void, 
    onViewOrigin: (origin: string) => void, 
    onDeleteItem: (id: string) => void,
    onViewHistory: (item: PriceMasterItem) => void,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  const filteredAndSortedPrices = useMemo(() => {
    let sortableItems = [...prices];

    if (searchTerm) {
      sortableItems = sortableItems.filter((item) =>
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.capitulo && item.capitulo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

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
  }, [prices, searchTerm, sortConfig]);

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

  return (
      <>
        <Input
            placeholder="Buscar por descripción o capítulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 max-w-sm"
        />
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
            {filteredAndSortedPrices.length > 0 ? (
                filteredAndSortedPrices.map((item) => (
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
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron precios. Sube un presupuesto para empezar.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
      </>
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


// --- Sección Principal de IA ---
export function AiSection({
    companies
}: {
    companies: Company[]
}) {
    const { toast } = useToast();

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

          if (querySnapshot.empty) {
            const newDocRef = doc(pricesRef);
            batch.set(newDocRef, {
                capitulo: capitulo.nombre,
                descripcion: partida.descripcion,
                unidad: partida.unidad,
                precioActual: precio,
                fechaUltimaActualizacion: now,
                historialPrecios: [newHistoryEntry],
                status: 'new'
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
               status: 'updated'
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
                userPrices: {},
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
        <Tabs defaultValue="upload-for-prices" className="w-full">
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
                <Tabs defaultValue="ai-budgets" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai-budgets"><Server className="mr-2" />Presupuestos IA</TabsTrigger>
                        <TabsTrigger value="price-database"><Database className="mr-2" />Base de Precios</TabsTrigger>
                    </TabsList>
                    <TabsContent value="ai-budgets" className="mt-6">
                       <AiBudgetsSection companies={companies} />
                    </TabsContent>
                    <TabsContent value="price-database" className="mt-6">
                        <PriceDatabaseSection />
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    );
}


    






    


