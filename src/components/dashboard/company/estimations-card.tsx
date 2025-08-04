
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Schema & Type ---

const estimationSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  tipoObra: z.string().min(1, "El tipo de obra es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  notes: z.string().optional(),
  price: z.coerce.number().optional(),
  m2: z.coerce.number().optional(),
});

export type Estimation = z.infer<typeof estimationSchema> & {
  id: string;
  createdAt: any; // Firestore Timestamp
};

// --- Form Dialog ---

function EstimationForm({ estimation, onSubmit, open, onOpenChange }: { estimation?: Estimation, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof estimationSchema>>({
    resolver: zodResolver(estimationSchema),
    defaultValues: {
      title: "",
      tipoObra: "",
      description: "",
      notes: "",
      price: 0,
      m2: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (estimation) {
        form.reset(estimation);
      } else {
        form.reset({
          title: "",
          tipoObra: "",
          description: "",
          notes: "",
          price: undefined,
          m2: undefined,
        });
      }
    }
  }, [estimation, open, form]);

  const handleSubmit = (values: z.infer<typeof estimationSchema>) => {
    onSubmit({ ...estimation, ...values });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{estimation ? "Editar Estimación" : "Añadir Nueva Estimación"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input placeholder="Ej: Estimación chalet en las afueras" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Precio (€)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="m2" render={({ field }) => (
                    <FormItem><FormLabel>Metros Cuadrados (m²)</FormLabel><FormControl><Input type="number" placeholder="120" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField
              control={form.control}
              name="tipoObra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Obra</FormLabel>
                  <FormControl><Input placeholder="Ej: Obra Nueva, Reforma Integral" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea placeholder="Detalles de la estimación, m2, calidades, etc." {...field} rows={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl><Input placeholder="Consideraciones, precios de referencia, etc." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{estimation ? "Guardar Cambios" : "Guardar Estimación"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- View Dialog ---

function ViewEstimationDialog({ estimation, open, onOpenChange }: { estimation: Estimation | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!estimation) return null;

    const pricePerM2 = (estimation.price && estimation.m2) ? estimation.price / estimation.m2 : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{estimation.title}</DialogTitle>
                    <DialogDescription>
                        Creado el: {estimation.createdAt?.toDate ? format(estimation.createdAt.toDate(), "d 'de' LLLL 'de' yyyy, HH:mm", { locale: es }) : 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] my-4">
                    <div className="space-y-4 pr-4">
                        <div className="grid grid-cols-3 gap-4">
                             <div>
                                <h4 className="font-semibold text-muted-foreground">Precio</h4>
                                <p>€{estimation.price?.toLocaleString('es-ES') || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Superficie</h4>
                                <p>{estimation.m2 || 'N/A'} m²</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Precio/m²</h4>
                                <p>{pricePerM2 > 0 ? `€${pricePerM2.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-muted-foreground">Tipo de Obra</h4>
                            <p>{estimation.tipoObra}</p>
                        </div>
                        <div className="whitespace-pre-wrap">
                            <h4 className="font-semibold text-muted-foreground">Descripción</h4>
                            <p>{estimation.description}</p>
                        </div>
                        {estimation.notes && (
                             <div className="whitespace-pre-wrap">
                                <h4 className="font-semibold text-muted-foreground">Notas Adicionales</h4>
                                <p>{estimation.notes}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- Main Component ---

export function EstimationsCard({
  estimations,
  onAddEstimation,
  onUpdateEstimation,
  onDeleteEstimation,
}: {
  estimations: Estimation[];
  onAddEstimation: (estimation: any) => void;
  onUpdateEstimation: (estimation: any) => void;
  onDeleteEstimation: (id: string) => void;
}) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingEstimation, setEditingEstimation] = useState<Estimation | undefined>(undefined);
  const [viewingEstimation, setViewingEstimation] = useState<Estimation | null>(null);

  const handleEdit = (estimation: Estimation) => {
    setEditingEstimation(estimation);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingEstimation(undefined);
    setFormOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingEstimation) {
      onUpdateEstimation(values);
    } else {
      onAddEstimation(values);
    }
  };

  return (
    <>
      <EstimationForm
        estimation={editingEstimation}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={setFormOpen}
      />
      <ViewEstimationDialog
        estimation={viewingEstimation}
        open={!!viewingEstimation}
        onOpenChange={() => setViewingEstimation(null)}
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Estimaciones de Obra</CardTitle>
            <CardDescription>Gestiona tus estimaciones y cálculos preliminares.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Estimación</Button>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo de Obra</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">m²</TableHead>
                  <TableHead className="text-right">€/m²</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimations.map(item => {
                    const pricePerM2 = (item.price && item.m2) ? item.price / item.m2 : 0;
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>{item.tipoObra}</TableCell>
                            <TableCell className="text-right font-mono">
                                {item.price ? `€${item.price.toLocaleString('es-ES')}` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {item.m2 ? `${item.m2}` : 'N/A'}
                            </TableCell>
                             <TableCell className="text-right font-mono">
                                {pricePerM2 > 0 ? `€${pricePerM2.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                            {item.createdAt?.toDate ? format(item.createdAt.toDate(), "dd/MM/yyyy") : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                            <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => setViewingEstimation(item)}><Eye className="mr-2" />Ver Detalles</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleEdit(item)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la estimación permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteEstimation(item.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )
                })}
                {estimations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay estimaciones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
