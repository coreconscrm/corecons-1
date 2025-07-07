"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreVertical, Pencil, Trash2, Upload, Eye, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BudgetPrintLayout } from "./budget-print-layout";
import type { Company } from "./company-card";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


// Schemas
const lineItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida."),
  quantity: z.coerce.number().min(0, "La medición debe ser positiva."),
  unit: z.enum(["m", "m2", "m3", "pa", "ud"]),
  unitPrice: z.coerce.number().min(0, "El precio debe ser positivo."),
});

const budgetSchema = z.object({
  name: z.string().min(1, "El nombre del presupuesto es requerido."),
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  companyId: z.string().min(1, "Debe seleccionar una empresa."),
  status: z.string().min(1, "El estado es requerido."),
  lineItems: z.array(lineItemSchema).min(1, "Debe añadir al menos una línea."),
});

// Tipos
export type LineItem = z.infer<typeof lineItemSchema>;
export type Budget = z.infer<typeof budgetSchema> & {
    id: string;
    documents: any[];
    total: number;
};


// --- Componente de Formulario de Presupuesto ---
function BudgetForm({ budget, clients, companies, onSubmit, open, onOpenChange }: { budget?: Budget, clients: any[], companies: any[], onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      clientId: "",
      companyId: "",
      status: "Pendiente",
      lineItems: [{ description: "", quantity: 0, unit: "ud", unitPrice: 0 }],
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

  useEffect(() => {
    if (budget && open) {
      form.reset(budget);
    } else if (!budget) {
      form.reset({
        name: "",
        clientId: "",
        companyId: "",
        status: "Pendiente",
        lineItems: [{ description: "", quantity: 0, unit: "ud", unitPrice: 0 }],
      });
    }
  }, [budget, open, form]);

  const handleSubmit = (values: z.infer<typeof budgetSchema>) => {
    const total = values.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    onSubmit({ ...(budget || {}), ...values, total, id: budget?.id || `bud-${Date.now()}` });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre del Presupuesto</FormLabel><FormControl><Input placeholder="Reforma integral vivienda" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem><FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger></FormControl>
                    <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="companyId" render={({ field }) => (
                <FormItem><FormLabel>Empresa Emisora</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una empresa" /></SelectTrigger></FormControl>
                    <SelectContent>{companies.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aceptado">Aceptado</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />


            <Card>
              <CardHeader><CardTitle>Líneas del Presupuesto</CardTitle></CardHeader>
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
                                <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => <Input {...field} placeholder="Demolición tabiquería" />} />
                            </TableCell>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <Input type="number" {...field} />} />
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
                                    </SelectContent>
                                </Select>
                                )} />
                            </TableCell>
                            <TableCell>
                                <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} />} />
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

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{budget ? 'Guardar Cambios' : 'Crear Presupuesto'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- Componente Principal ---
export function BudgetListCard({ budgets, clients, companies, onAddBudget, onUpdateBudget, onDeleteBudget }: { budgets: Budget[], clients: any[], companies: Company[], onAddBudget: (b: any) => void, onUpdateBudget: (b: any) => void, onDeleteBudget: (id: string) => void }) {
  const [isAddBudgetOpen, setAddBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [viewingBudget, setViewingBudget] = useState<Budget | undefined>(undefined);
  const [printingBudget, setPrintingBudget] = useState<Budget | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (printingBudget) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingBudget(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [printingBudget]);

  const handleDocUpload = async (file: File, budget: Budget) => {
    if (!budget) return;
    setIsUploading(true);

    const storageRef = ref(storage, `budgets/${budget.id}/documents/${file.name}`);
    
    try {
        const snapshot = await uploadBytesResumable(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const newDoc = { name: file.name, url: downloadURL };
        const updatedBudget = {
            ...budget,
            documents: [...budget.documents, newDoc],
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


  return (
    <div>
      <div className="printable-area">
        <BudgetPrintLayout 
          budget={printingBudget}
          client={printingBudget ? clients.find(c => c.id === printingBudget.clientId) : null}
          company={printingBudget ? companies.find(c => c.id === printingBudget.companyId) : null}
        />
      </div>

      {/* Diálogos */}
      <BudgetForm budget={editingBudget} clients={clients} companies={companies} onSubmit={onUpdateBudget} open={!!editingBudget} onOpenChange={() => setEditingBudget(undefined)} />
      <BudgetForm clients={clients} companies={companies} onSubmit={onAddBudget} open={isAddBudgetOpen} onOpenChange={setAddBudgetOpen} />
      
      {viewingBudget && (
          <Dialog open={!!viewingBudget} onOpenChange={() => setViewingBudget(undefined)}>
              <DialogContent className="max-w-4xl">
                  <DialogHeader>
                      <DialogTitle>Detalle del Presupuesto: {viewingBudget.name}</DialogTitle>
                      <DialogDescription>Cliente: {clients.find(c => c.id === viewingBudget.clientId)?.name || 'N/A'}</DialogDescription>
                  </DialogHeader>
                   <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-2/5">Descripción</TableHead>
                            <TableHead className="text-right">Medición</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="text-right">Precio/Ud.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewingBudget.lineItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right font-mono">€{item.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-mono">€{(item.quantity * item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                   </div>
                  <CardFooter className="justify-end bg-secondary/50 p-4 mt-4">
                        <div className="text-xl font-bold">
                            Total Presupuesto: <span className="font-mono">€{viewingBudget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </CardFooter>
                  <DialogFooter>
                      <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 mt-12 lg:mt-0">
        <h2 className="text-2xl font-bold">Presupuestos</h2>
        <Button onClick={() => setAddBudgetOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Crear Presupuesto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgets.map(budget => (
          <Card key={budget.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow border-border/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle className="mb-1">{budget.name}</CardTitle>
                      <CardDescription>{clients.find(c => c.id === budget.clientId)?.name}</CardDescription>
                      <CardDescription className="text-xs pt-1">Emitido por: {companies.find(c => c.id === budget.companyId)?.name}</CardDescription>
                  </div>
                  <AlertDialog>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => setViewingBudget(budget)}><Eye className="mr-2"/>Ver</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEditingBudget(budget)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setPrintingBudget(budget)}><Printer className="mr-2"/>Imprimir</DropdownMenuItem>
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
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-2xl font-bold font-mono text-primary">€{budget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">{budget.status}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <div>
                    <h4 className="font-semibold text-sm mb-2">Documentos</h4>
                    {budget.documents.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-muted-foreground">{budget.documents.map((doc: any, i: number) => <li key={i}><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.name}</a></li>)}</ul>
                    ) : <p className="text-sm text-muted-foreground">No hay documentos.</p>}
                </div>
                 <Button variant="outline" size="sm" onClick={() => {
                     const fileInput = document.createElement('input');
                     fileInput.type = 'file';
                     fileInput.onchange = (e) => {
                         const file = (e.target as HTMLInputElement).files?.[0];
                         if (file) {
                            handleDocUpload(file, budget);
                         }
                     }
                     fileInput.click();
                 }} disabled={isUploading}>
                     {isUploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />} Subir
                 </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
