
"use client"

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Library, ListChecks, CheckSquare } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Schemas & Types ---

const stageSchema = z.object({
  name: z.string().min(1, "El nombre de la etapa es requerido."),
  description: z.string().min(1, "La descripción de la etapa es requerida."),
});

const protocolSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  stages: z.array(stageSchema).min(1, "Se requiere al menos una etapa."),
});

export type ProtocolStage = z.infer<typeof stageSchema>;
export type Protocol = z.infer<typeof protocolSchema> & {
  id: string;
  date: any; // Firestore Timestamp
};

// --- Form Dialog ---

function ProtocolForm({ protocol, onSubmit, open, onOpenChange }: { protocol?: Protocol, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof protocolSchema>>({
    resolver: zodResolver(protocolSchema),
    defaultValues: protocol || { title: "", description: "", stages: [{ name: "", description: "" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages"
  });

  useEffect(() => {
    if (open) {
      if (protocol) {
        form.reset({ ...protocol, stages: protocol.stages.length > 0 ? protocol.stages : [{ name: "", description: "" }] });
      } else {
        form.reset({ title: "", description: "", stages: [{ name: "", description: "" }] });
      }
    }
  }, [protocol, open, form]);

  const handleSubmit = (values: z.infer<typeof protocolSchema>) => {
    onSubmit({ ...protocol, ...values, date: new Date() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{protocol ? "Editar Protocolo" : "Crear Nuevo Protocolo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Título del Protocolo</FormLabel><FormControl><Input placeholder="Ej: Protocolo de Inicio de Obra" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descripción General (Opcional)</FormLabel><FormControl><Textarea placeholder="Describe el propósito de este protocolo" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <Card>
              <CardHeader>
                <CardTitle>Etapas del Protocolo</CardTitle>
                <CardDescription>Define las fases y tareas de este protocolo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-2 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    <FormField control={form.control} name={`stages.${index}.name`} render={({ field }) => (
                      <FormItem><FormLabel>Nombre de la Etapa {index + 1}</FormLabel><FormControl><Input placeholder="Ej: Replanteo Inicial" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`stages.${index}.description`} render={({ field }) => (
                      <FormItem><FormLabel>Descripción / Tareas</FormLabel><FormControl><Textarea placeholder="Detalla los pasos o verificaciones de esta etapa..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                ))}
                 <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: "", description: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Etapa
                </Button>
              </CardContent>
            </Card>

            <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{protocol ? "Guardar Cambios" : "Guardar Protocolo"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

export function ProtocolsCard({
  protocols,
  onAddProtocol,
  onUpdateProtocol,
  onDeleteProtocol,
}: {
  protocols: Protocol[];
  onAddProtocol: (protocol: any) => void;
  onUpdateProtocol: (protocol: any) => void;
  onDeleteProtocol: (id: string) => void;
}) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | undefined>(undefined);

  const handleEdit = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProtocol(undefined);
    setFormOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingProtocol) {
      onUpdateProtocol(values);
    } else {
      onAddProtocol(values);
    }
  };

  return (
    <>
      <ProtocolForm
        protocol={editingProtocol}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={setFormOpen}
      />
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Protocolos de Actuación</CardTitle>
            <CardDescription>Crea y gestiona plantillas para los procesos y flujos de trabajo de la empresa.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Crear Protocolo</Button>
        </CardHeader>
        <CardContent>
          {protocols.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {protocols.map((protocol) => (
                <AccordionItem value={protocol.id} key={protocol.id} className="border rounded-md px-4">
                  <div className="flex justify-between items-center w-full">
                    <AccordionTrigger className="flex-1">
                      <div className="flex flex-col text-left">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Library size={20} /> {protocol.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{protocol.description}</p>
                      </div>
                    </AccordionTrigger>
                    <div className="pl-4">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleEdit(protocol)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el protocolo "{protocol.title}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteProtocol(protocol.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent className="pt-4 border-t mt-2">
                    <div className="space-y-4">
                      {protocol.stages.map((stage, index) => (
                        <div key={index} className="pl-4 border-l-2 border-primary/50">
                          <h4 className="font-semibold text-md flex items-center gap-2"><CheckSquare size={18} /> {stage.name}</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{stage.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ListChecks className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No hay protocolos definidos</h3>
              <p className="mt-1 text-sm">Haz clic en "Crear Protocolo" para empezar a estandarizar tus procesos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
