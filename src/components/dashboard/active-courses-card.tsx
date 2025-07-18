
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, FileText, Building, Phone, Mail, Info, MapPin, FilePlus2, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BudgetCategory } from "./budgets-card";

const clientSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  localizacion: z.string().optional(),
  arquitecto: z.string().optional(),
  providerId: z.string().optional(),
  obtenido: z.enum(["Formulario", "Correo", "Whatsapp", "Promotoras", "Recomendado", ""]).optional(),
  estado: z.enum(["Contactado", "En Progreso", "En Licencia", "Firmado", "En Construcción", "Finalizado", ""]).optional(),
  infoAdicional: z.string().optional(),
  memoria: z.string().url().optional().or(z.literal('')),
  planos: z.string().url().optional().or(z.literal('')),
});

type Client = z.infer<typeof clientSchema> & { id: string };

function FileUploader({ form, fieldName, clientId, label }: { form: any, fieldName: 'memoria' | 'planos', clientId: string | undefined, label: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const currentFileUrl = form.watch(fieldName);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !clientId) return;

        setIsUploading(true);
        const storageRef = ref(storage, `clients/${clientId}/${fieldName}/${file.name}`);
        try {
            const snapshot = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            form.setValue(fieldName, downloadURL, { shouldValidate: true });
            toast({ title: `${label} subido`, description: "El archivo se ha guardado." });
        } catch (error) {
            toast({ variant: 'destructive', title: `Error al subir ${label}`, description: (error as Error).message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-4">
                <FormControl>
                    <Input type="file" onChange={handleFileUpload} disabled={isUploading || !clientId} className="flex-1" />
                </FormControl>
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                {currentFileUrl && (
                    <Button variant="outline" size="icon" asChild>
                        <a href={currentFileUrl} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5" /></a>
                    </Button>
                )}
            </div>
            {!clientId && <p className="text-xs text-muted-foreground">Guarda la obra para poder subir archivos.</p>}
            <FormMessage />
        </FormItem>
    );
}


function ClientForm({ client, onSubmit, onOpenChange, open, providers }: { client?: Client, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, providers: any[] }) {
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", contact: "", email: "", phone: "", localizacion: "", estado: "", arquitecto: "", providerId: "", obtenido: "", infoAdicional: "", memoria: "", planos: "" },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
            name: client.name || "",
            contact: client.contact || "",
            email: client.email || "",
            phone: client.phone || "",
            localizacion: client.localizacion || "",
            arquitecto: client.arquitecto || "",
            providerId: client.providerId || "",
            obtenido: client.obtenido || "",
            estado: client.estado || "",
            infoAdicional: client.infoAdicional || "",
            memoria: client.memoria || "",
            planos: client.planos || "",
        });
      } else {
        form.reset({ name: "", contact: "", email: "", phone: "", localizacion: "", estado: "", arquitecto: "", providerId: "", obtenido: "", infoAdicional: "", memoria: "", planos: "" });
      }
    }
  }, [client, open, form]);

  const handleSubmit = (values: z.infer<typeof clientSchema>) => {
    onSubmit({ ...client, ...values, obtenido: values.obtenido || '' });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Obra" : "Añadir Nueva Obra"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre del Proyecto</FormLabel><FormControl><Input placeholder="Proyecto de reforma" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contact" render={({ field }) => (
                <FormItem><FormLabel>Persona de Contacto</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-4567" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="localizacion" render={({ field }) => (
                    <FormItem><FormLabel>Localización</FormLabel><FormControl><Input placeholder="Ciudad, Dirección" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="arquitecto" render={({ field }) => (
                    <FormItem><FormLabel>Arquitecto</FormLabel><FormControl><Input placeholder="Nombre del arquitecto" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="providerId" render={({ field }) => (
                    <FormItem><FormLabel>Proveedor Asignado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                            <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="estado" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estado del Proyecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Contactado">Contactado</SelectItem>
                            <SelectItem value="En Progreso">En Progreso</SelectItem>
                            <SelectItem value="En Licencia">En Licencia</SelectItem>
                            <SelectItem value="Firmado">Firmado</SelectItem>
                            <SelectItem value="En Construcción">En Construcción</SelectItem>
                            <SelectItem value="Finalizado">Finalizado</SelectItem>
                        </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="obtenido" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Obtenido a través de</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un origen" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Formulario">Formulario</SelectItem>
                            <SelectItem value="Correo">Correo</SelectItem>
                            <SelectItem value="Whatsapp">Whatsapp</SelectItem>
                            <SelectItem value="Promotoras">Promotoras</SelectItem>
                            <SelectItem value="Recomendado">Recomendado</SelectItem>
                        </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="infoAdicional" render={({ field }) => (
                <FormItem><FormLabel>Información Adicional</FormLabel><FormControl><Textarea placeholder="Añade detalles importantes..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploader form={form} fieldName="memoria" clientId={client?.id} label="Memoria" />
                <FileUploader form={form} fieldName="planos" clientId={client?.id} label="Planos" />
            </div>

            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{client ? "Guardar Cambios" : "Guardar Obra"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientListCard({ clients, onAddClient, onUpdateClient, onDeleteClient, providers, onCreateBudgetFromClient }: { clients: Client[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: string) => void, providers: any[], onCreateBudgetFromClient: (client: any, category: BudgetCategory) => void }) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [viewingInfo, setViewingInfo] = useState<string | null>(null);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setAddDialogOpen(true);
  }
  
  const handleAdd = () => {
    setEditingClient(undefined);
    setAddDialogOpen(true);
  }

  return (
    <Card>
      <Dialog open={!!viewingInfo} onOpenChange={() => setViewingInfo(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Información Adicional</DialogTitle></DialogHeader>
            <div className="py-4 whitespace-pre-wrap">{viewingInfo}</div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <ClientForm client={editingClient} onSubmit={editingClient ? onUpdateClient : onAddClient} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} providers={providers} />
      
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Obra Nueva</CardTitle>
          <CardDescription>Gestiona tus proyectos de obra nueva.</CardDescription>
        </div>
        <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Obra</Button>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {clients.map(client => {
            const provider = providers.find(p => p.id === client.providerId);
            return (
              <AccordionItem value={client.id} key={client.id} className="border-none">
                 <Card className="flex flex-col overview-card">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                      <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          {client.estado && <Badge variant="secondary" className="mt-1">{client.estado}</Badge>}
                        </div>
                      </AccordionTrigger>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleEdit(client)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onCreateBudgetFromClient(client, 'enviados')}><FilePlus2 className="mr-2"/>Crear Presupuesto</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onCreateBudgetFromClient(client, 'obra_nueva')}><Copy className="mr-2"/>Copiar a Presupuestos</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la obra.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteClient(client.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardHeader>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    <div className="space-y-4 flex-grow text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Contacto</h4>
                        <div className="space-y-1 text-muted-foreground">
                          <p>{client.contact}</p>
                          <div className="flex items-center gap-2"><Phone size={14}/> {client.phone}</div>
                          <div className="flex items-center gap-2"><Mail size={14}/> {client.email}</div>
                          {client.localizacion && <div className="flex items-center gap-2"><MapPin size={14}/> {client.localizacion}</div>}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Detalles del Proyecto</h4>
                        <div className="space-y-1 text-muted-foreground">
                          <div className="flex justify-between"><span>Arquitecto:</span> <strong>{client.arquitecto || 'N/A'}</strong></div>
                          <div className="flex justify-between"><span>Proveedor:</span> <strong>{provider?.name || 'N/A'}</strong></div>
                          {client.obtenido && <div className="flex justify-between"><span>Obtenido:</span> <strong>{client.obtenido}</strong></div>}
                        </div>
                      </div>
                       {client.infoAdicional && (
                          <div className="pt-2 border-t">
                            <h4 className="font-semibold mb-1">Info Adicional:</h4>
                            <p 
                              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                              onClick={() => setViewingInfo(client.infoAdicional || null)}
                            >
                              {client.infoAdicional.substring(0, 100)}{client.infoAdicional.length > 100 ? '...' : ''}
                            </p>
                        </div>
                       )}
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <a href={client.memoria || '#'} target="_blank" rel="noopener noreferrer" className={!client.memoria ? 'pointer-events-none' : ''}>
                            <Button className="w-full" variant="outline" disabled={!client.memoria}><FileText className="mr-2"/> Memoria</Button>
                        </a>
                        <a href={client.planos || '#'} target="_blank" rel="noopener noreferrer" className={!client.planos ? 'pointer-events-none' : ''}>
                            <Button className="w-full" variant="outline" disabled={!client.planos}><FileText className="mr-2"/> Planos</Button>
                        </a>
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
