
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreVertical, Pencil, Trash2, Upload, Eye, Printer, Loader2, TrendingUp, TrendingDown, Home, Scaling, Move, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BudgetPrintLayout } from "./budget-print-layout";
import type { Company } from "./company-card";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "../ui/badge";


// Schemas
const lineItemSchema = z.object({
  description: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unit: z.enum(["m", "m2", "m3", "pa", "ud", "cap"]).optional(),
  unitPrice: z.coerce.number().optional(),
});

const budgetSchema = z.object({
  name: z.string().optional(),
  clientId: z.string().optional(),
  companyId: z.string().optional(),
  status: z.string().optional(),
  m2: z.coerce.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  category: z.enum(["enviados", "obra_nueva", "reformas", "subcontratas"]).optional(),
});


const percentageSchema = z.object({
  percentage: z.coerce.number().min(0, "El porcentaje no puede ser negativo."),
});

const moveBudgetSchema = z.object({
  category: z.enum(["enviados", "obra_nueva", "reformas", "subcontratas"]),
});


// Tipos
export type BudgetCategory = z.infer<typeof budgetSchema>['category'];
export type LineItem = z.infer<typeof lineItemSchema>;
export type Budget = z.infer<typeof budgetSchema> & {
    id: string;
    documents?: any[];
    total: number;
    m2?: number;
};

const budgetCategories: { value: BudgetCategory, label: string }[] = [
    { value: 'enviados', label: 'Enviados' },
    { value: 'obra_nueva', label: 'Obra Nueva' },
    { value: 'reformas', label: 'Reformas' },
    { value: 'subcontratas', label: 'Subcontratas' },
];

function MoveBudgetDialog({ budget, open, onOpenChange, onMove }: { budget: Budget, open: boolean, onOpenChange: (open: boolean) => void, onMove: (category: BudgetCategory) => void }) {
  const form = useForm<z.infer<typeof moveBudgetSchema>>({
    resolver: zodResolver(moveBudgetSchema),
    defaultValues: { category: budget.category },
  });

  const handleSubmit = (values: z.infer<typeof moveBudgetSchema>) => {
    onMove(values.category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mover Presupuesto</DialogTitle>
          <DialogDescription>
            Selecciona la nueva categoría para el presupuesto "{budget.name}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Categoría</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Mover Presupuesto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function PercentageDialog({ open, onOpenChange, onApply }: { open: boolean, onOpenChange: (open: boolean) => void, onApply: (percentage: number) => void }) {
  const form = useForm<z.infer<typeof percentageSchema>>({
    resolver: zodResolver(percentageSchema),
    defaultValues: { percentage: 0 },
  });

  const handleSubmit = (values: z.infer<typeof percentageSchema>) => {
    onApply(values.percentage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Incrementar Precios</DialogTitle>
          <DialogDescription>
            Introduce el porcentaje que quieres sumar a todos los precios unitarios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de Incremento (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Aplicar Incremento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DecreasePercentageDialog({ open, onOpenChange, onApply }: { open: boolean, onOpenChange: (open: boolean) => void, onApply: (percentage: number) => void }) {
  const form = useForm<z.infer<typeof percentageSchema>>({
    resolver: zodResolver(percentageSchema),
    defaultValues: { percentage: 0 },
  });

  const handleSubmit = (values: z.infer<typeof percentageSchema>) => {
    onApply(values.percentage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Disminuir Precios</DialogTitle>
          <DialogDescription>
            Introduce el porcentaje que quieres restar a todos los precios unitarios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de Disminución (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Aplicar Disminución</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- Componente de Formulario de Presupuesto ---
function BudgetForm({ budget, clients, companies, onSubmit, open, onOpenChange, activeCategory }: { budget?: Budget, clients: any[], companies: any[], onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, activeCategory: BudgetCategory }) {
  const [isIncreaseDialogOpen, setIncreaseDialogOpen] = useState(false);
  const [isDecreaseDialogOpen, setDecreaseDialogOpen] = useState(false);
  
  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      clientId: "",
      companyId: "",
      status: "Pendiente",
      m2: 0,
      lineItems: [{ description: "", quantity: 0, unit: "ud", unitPrice: 0 }],
      category: activeCategory,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems"
  });

  const watchedLineItems = useWatch({
    control: form.control,
    name: "lineItems",
  });

  const grandTotal = useMemo(() => {
    if (!watchedLineItems) return 0;
    return watchedLineItems.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
  }, [watchedLineItems]);

  const handleApplyIncrease = (percentage: number) => {
    const currentItems = form.getValues("lineItems") || [];
    const updatedItems = currentItems.map(item => ({
      ...item,
      unitPrice: (item.unitPrice || 0) * (1 + percentage / 100)
    }));
    form.setValue("lineItems", updatedItems, { shouldDirty: true, shouldValidate: true });
  };
  
  const handleApplyDecrease = (percentage: number) => {
    const currentItems = form.getValues("lineItems") || [];
    const updatedItems = currentItems.map(item => ({
      ...item,
      unitPrice: (item.unitPrice || 0) * (1 - percentage / 100)
    }));
    form.setValue("lineItems", updatedItems, { shouldDirty: true, shouldValidate: true });
  };


  useEffect(() => {
    if (open) {
      if (budget) {
        form.reset({ ...budget, m2: budget.m2 || 0 });
      } else {
        form.reset({
          name: "",
          clientId: "",
          companyId: "",
          status: "Pendiente",
          m2: 0,
          lineItems: [{ description: "", quantity: 0, unit: "ud", unitPrice: 0 }],
          category: activeCategory,
        });
      }
    }
  }, [budget, open, form, activeCategory]);

  const handleSubmit = (values: z.infer<typeof budgetSchema>) => {
    const total = (values.lineItems || []).reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    onSubmit({ ...(budget || {}), ...values, total, id: budget?.id || `bud-${Date.now()}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PercentageDialog open={isIncreaseDialogOpen} onOpenChange={setIncreaseDialogOpen} onApply={handleApplyIncrease} />
      <DecreasePercentageDialog open={isDecreaseDialogOpen} onOpenChange={setDecreaseDialogOpen} onApply={handleApplyDecrease} />
      <DialogContent className="max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre del Presupuesto</FormLabel><FormControl><Input placeholder="Reforma integral vivienda" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem><FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger></FormControl>
                    <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="companyId" render={({ field }) => (
                <FormItem><FormLabel>Empresa Emisora</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una empresa" /></SelectTrigger></FormControl>
                    <SelectContent>{companies.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="m2" render={({ field }) => (
                <FormItem><FormLabel>M²</FormLabel><FormControl><Input type="number" placeholder="100" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Enviados">Enviados</SelectItem>
                        <SelectItem value="Aceptado">Aceptado</SelectItem>
                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                        <SelectItem value="Hechos">Hechos</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {budgetCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
             </div>


            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Líneas del Presupuesto</CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDecreaseDialogOpen(true)}>
                    <TrendingDown className="mr-2 h-4 w-4" /> Disminuir Precios
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIncreaseDialogOpen(true)}>
                    <TrendingUp className="mr-2 h-4 w-4" /> Incrementar Precios
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="min-w-[250px]">Descripción</TableHead>
                        <TableHead className="min-w-[100px]">Medición</TableHead>
                        <TableHead className="min-w-[120px]">Unidad</TableHead>
                        <TableHead className="min-w-[120px]">Precio/Ud.</TableHead>
                        <TableHead className="min-w-[120px]">Total</TableHead>
                        <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                        const itemTotal = (watchedLineItems?.[index]?.quantity || 0) * (watchedLineItems?.[index]?.unitPrice || 0);
                        return (
                            <TableRow key={field.id}>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => <Input {...field} placeholder="Demolición tabiquería" value={field.value ?? ''}/>} />
                            </TableCell>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''}/>} />
                            </TableCell>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.unit`} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="m2">m2</SelectItem>
                                    <SelectItem value="m3">m3</SelectItem>
                                    <SelectItem value="pa">pa</SelectItem>
                                    <SelectItem value="ud">ud</SelectItem>
                                    <SelectItem value="cap">cap</SelectItem>
                                    </SelectContent>
                                </Select>
                                )} />
                            </TableCell>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''}/>} />
                            </TableCell>
                            <TableCell className="font-mono text-right">
                                €{itemTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: "", quantity: 0, unit: "ud", unitPrice: 0 })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Línea
                </Button>
              </CardContent>
              <CardFooter className="justify-end bg-secondary/50 p-4">
                  <div className="text-xl font-bold">
                      Total Presupuesto: <span className="font-mono">€{grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
              </CardFooter>
            </Card>

            <DialogFooter className="pt-4 mt-auto border-t">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{budget ? 'Guardar Cambios' : 'Crear Presupuesto'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- Componente de item de acordeón de presupuesto ---
function BudgetAccordionItem({
    budget,
    clients,
    companies,
    onUpdateBudget,
    onDeleteBudget,
    setViewingBudget,
    setMovingBudget,
    setPrintingBudget,
    handleEditBudget,
}: {
    budget: Budget;
    clients: any[];
    companies: Company[];
    onUpdateBudget: (budget: Budget) => void;
    onDeleteBudget: (id: string) => void;
    setViewingBudget: (budget: Budget | undefined) => void;
    setMovingBudget: (budget: Budget | undefined) => void;
    setPrintingBudget: (budget: Budget | null) => void;
    handleEditBudget: (budget: Budget) => void;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleDocUpload = async (file: File) => {
        setIsUploading(true);
        const storageRef = ref(storage, `budgets/${budget.id}/documents/${file.name}`);
        
        try {
            const snapshot = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
    
            const newDoc = { name: file.name, url: downloadURL };
            const updatedBudget = {
                ...budget,
                documents: [...(budget.documents || []), newDoc],
            };
    
            onUpdateBudget(updatedBudget);
            toast({ title: "Documento subido", description: `El archivo ${newDoc.name} ha sido añadido.` });
        } catch (error) {
            console.error("Error uploading document: ", error);
            toast({ variant: 'destructive', title: "Error al subir", description: `No se pudo subir el archivo. Error: ${(error as Error).message}` });
        } finally {
            setIsUploading(false);
        }
    };

    const client = clients.find(c => c.id === budget.clientId);
    const company = companies.find(c => c.id === budget.companyId);

    return (
        <AccordionItem value={budget.id} key={budget.id} className="border-none">
            <Card className="flex flex-col overview-card">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                        <div className="text-left">
                            <h3 className="font-semibold text-lg">{budget.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                    {budget.status && <Badge variant="secondary">{budget.status}</Badge>}
                                    <span className="text-sm text-muted-foreground">{client?.name}</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setViewingBudget(budget)}><Eye className="mr-2"/>Ver Detalle</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEditBudget(budget)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setPrintingBudget(budget)}><Printer className="mr-2"/>Imprimir</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setMovingBudget(budget)}><Move className="mr-2"/>Mover a...</DropdownMenuItem>
                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el presupuesto.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteBudget(budget.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <AccordionContent className="px-6 pb-6 pt-0">
                    <div className="space-y-4">
                        <div>
                            <p className="text-2xl font-bold font-mono text-primary">€{budget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-sm text-muted-foreground">Emitido por: {company?.name || 'N/A'}</p>
                        </div>
                        {budget.m2 && budget.m2 > 0 && (
                            <div className="flex items-center text-sm text-muted-foreground gap-4 border-t pt-3">
                                <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-primary"/>
                                    <span>Superficie: <strong>{budget.m2} m²</strong></span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <Scaling className="h-4 w-4 text-primary"/>
                                    <span>€/m²: <strong>{(budget.total / budget.m2).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t pt-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Documentos</h4>
                                {(budget.documents || []).length > 0 ? (
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">{(budget.documents || []).map((doc: any, i: number) => <li key={i}><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.name}</a></li>)}</ul>
                                ) : <p className="text-sm text-muted-foreground">No hay documentos.</p>}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                const fileInput = document.createElement('input');
                                fileInput.type = 'file';
                                fileInput.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      handleDocUpload(file);
                                    }
                                }
                                fileInput.click();
                            }} disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />} Subir
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    );
}


// --- Componente de lista ---
function BudgetListCard({ title, budgets, clients, companies, onAddBudget, onUpdateBudget, onDeleteBudget, activeCategory }: { title: string, budgets: Budget[], clients: any[], companies: Company[], onAddBudget: (b: any) => void, onUpdateBudget: (b: any) => void, onDeleteBudget: (id: string) => void, activeCategory: BudgetCategory }) {
  const [isAddBudgetOpen, setAddBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [viewingBudget, setViewingBudget] = useState<Budget | undefined>(undefined);
  const [movingBudget, setMovingBudget] = useState<Budget | undefined>(undefined);
  const [printingBudget, setPrintingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (printingBudget) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingBudget(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [printingBudget]);

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setAddBudgetOpen(true);
  };
  
  const handleAddBudget = () => {
    setEditingBudget(undefined);
    setAddBudgetOpen(true);
  };
  
  const handleMoveBudget = (category: BudgetCategory) => {
    if (!movingBudget) return;
    onUpdateBudget({ ...movingBudget, category });
    setMovingBudget(undefined);
  }

  const handleSubmit = (values: any) => {
    if(editingBudget) {
        onUpdateBudget(values);
    } else {
        onAddBudget(values);
    }
    setAddBudgetOpen(false);
  }


  return (
    <Card>
       <div className="printable-area">
        <BudgetPrintLayout 
          budget={printingBudget}
          client={printingBudget ? clients.find(c => c.id === printingBudget.clientId) : null}
          company={printingBudget ? companies.find(c => c.id === printingBudget.companyId) : null}
        />
      </div>

      {/* Diálogos */}
      <BudgetForm budget={editingBudget} clients={clients} companies={companies} onSubmit={handleSubmit} open={isAddBudgetOpen} onOpenChange={setAddBudgetOpen} activeCategory={activeCategory} />
      {movingBudget && <MoveBudgetDialog budget={movingBudget} open={!!movingBudget} onOpenChange={() => setMovingBudget(undefined)} onMove={handleMoveBudget} />}
      
      {viewingBudget && (
          <Dialog open={!!viewingBudget} onOpenChange={() => setViewingBudget(undefined)}>
              <DialogContent className="max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
                  <DialogHeader>
                      <DialogTitle>Detalle del Presupuesto: {viewingBudget.name}</DialogTitle>
                      <DialogDescription>Cliente: {clients.find(c => c.id === viewingBudget.clientId)?.name || 'N/A'}</DialogDescription>
                  </DialogHeader>
                   <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-2/5">Descripción</TableHead>
                            <TableHead className="text-right">Medición</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="text-right">Precio/Ud.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                             {(viewingBudget.m2 && viewingBudget.m2 > 0) && (
                                <TableHead className="text-right">€ / m²</TableHead>
                            )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(viewingBudget.lineItems || []).map((item, index) => {
                                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                const costPerM2 = (viewingBudget.m2 && viewingBudget.m2 > 0) ? lineTotal / viewingBudget.m2 : 0;
                                return (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell className="text-right font-mono">€{(item.unitPrice || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-mono">€{lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        {(viewingBudget.m2 && viewingBudget.m2 > 0) && (
                                            <TableCell className="text-right font-mono">
                                                €{costPerM2.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                   </div>
                  <CardFooter className="justify-end bg-secondary/50 p-4 mt-auto border-t -mx-6 -mb-6">
                        <div className="text-xl font-bold">
                            Total Presupuesto: <span className="font-mono">€{viewingBudget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </CardFooter>
                  <DialogFooter className="mt-auto pt-4">
                      <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
      
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={handleAddBudget}><PlusCircle className="mr-2 h-4 w-4" />Crear Presupuesto</Button>
      </CardHeader>
      
       <CardContent>
            {budgets.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {budgets.map(budget => (
                        <BudgetAccordionItem
                            key={budget.id}
                            budget={budget}
                            clients={clients}
                            companies={companies}
                            onUpdateBudget={onUpdateBudget}
                            onDeleteBudget={onDeleteBudget}
                            setViewingBudget={setViewingBudget}
                            setMovingBudget={setMovingBudget}
                            setPrintingBudget={setPrintingBudget}
                            handleEditBudget={handleEditBudget}
                        />
                    ))}
                </Accordion>
            ) : (
                <div className="text-center py-12 text-muted-foreground">No hay presupuestos en esta categoría.</div>
            )}
        </CardContent>
    </Card>
  );
}

// --- Componente Principal ---
export function BudgetSection({ budgets, clients, companies, onAddBudget, onUpdateBudget, onDeleteBudget }: { budgets: Budget[], clients: any[], companies: Company[], onAddBudget: (b: any) => void, onUpdateBudget: (b: any) => void, onDeleteBudget: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<BudgetCategory>('enviados');

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => (b.category || 'enviados') === activeTab);
  }, [budgets, activeTab]);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BudgetCategory)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {budgetCategories.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {budgetCategories.map(tab => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          <BudgetListCard
            title={`Presupuestos de ${tab.label}`}
            budgets={activeTab === tab.value ? filteredBudgets : []}
            clients={clients}
            companies={companies}
            onAddBudget={onAddBudget}
            onUpdateBudget={onUpdateBudget}
            onDeleteBudget={onDeleteBudget}
            activeCategory={tab.value as BudgetCategory}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
