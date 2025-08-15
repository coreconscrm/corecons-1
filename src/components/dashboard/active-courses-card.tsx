
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, FileText, Building, Phone, Mail, Info, MapPin, FilePlus2, Copy, Repeat, Star, FolderOpen, Move } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BudgetCategory } from "./budgets-card";
import { Progress } from "@/components/ui/progress";


const clientSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  localizacion: z.string().optional(),
  arquitecto: z.string().optional(),
  providerId: z.string().optional(),
  obtenido: z.enum(["Formulario", "Correo", "Whatsapp", "Promotoras", "Recomendado", ""]).optional(),
  infoAdicional: z.string().optional(),
  memoria: z.string().url().optional().or(z.literal('')),
  planos: z.string().url().optional().or(z.literal('')),
  memoriaFile: z.any().optional(),
  planosFile: z.any().optional(),
  priority: z.number().nullable().optional(),
  category: z.string().optional(),
});

type Client = z.infer<typeof clientSchema> & { id: string };

function FileUploader({ form, fieldName, currentUrl, label, disabled, onFileSelect }: { form: any, fieldName: 'memoriaFile' | 'planosFile', currentUrl?: string, label: string, disabled: boolean, onFileSelect: (file: File | null) => void }) {
    const [preview, setPreview] = useState<string | undefined>(currentUrl);

    useEffect(() => {
        setPreview(currentUrl);
    }, [currentUrl]);
    
    const fileRef = form.register(fieldName);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
        } else {
            onFileSelect(null);
        }
    };
    
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-4">
                <FormControl>
                     <Input
                        type="file"
                        {...fileRef}
                        onChange={handleFileChange}
                        disabled={disabled}
                        className="flex-1"
                    />
                </FormControl>
                {preview && (
                    <Button variant="outline" size="icon" asChild>
                        <a href={preview} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5" /></a>
                    </Button>
                )}
            </div>
            <FormMessage />
        </FormItem>
    );
}

function ClientForm({ client, onSubmit, onOpenChange, open, providers, categories }: { client?: Client, onSubmit: (values: any) => Promise<void>, open: boolean, onOpenChange: (open: boolean) => void, providers: any[], categories: string[] }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [memoriaFile, setMemoriaFile] = useState<File | null>(null);
  const [planosFile, setPlanosFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ memoria: number, planos: number }>({ memoria: 0, planos: 0 });

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", contact: "", email: "", phone: "", localizacion: "", arquitecto: "", providerId: "", obtenido: "", infoAdicional: "", memoria: "", planos: "", priority: null, category: "General" },
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
            infoAdicional: client.infoAdicional || "",
            memoria: client.memoria || "",
            planos: client.planos || "",
            priority: client.priority,
            category: client.category || "General",
        });
      } else {
        form.reset({ name: "", contact: "", email: "", phone: "", localizacion: "", arquitecto: "", providerId: "", obtenido: "", infoAdicional: "", memoria: "", planos: "", priority: null, category: "General" });
      }
      setMemoriaFile(null);
      setPlanosFile(null);
      setIsSaving(false);
      setUploadProgress({ memoria: 0, planos: 0 });
    }
  }, [client, open, form]);

  const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(Math.round(progress));
            },
            (error) => {
                console.error("Upload failed:", error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
  };

  const handleSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsSaving(true);
    const clientId = client?.id || `client-${Date.now()}`;
    let submissionData: any = { ...values, id: clientId };

    try {
        if (memoriaFile) {
            submissionData.memoria = await uploadFile(
                memoriaFile, 
                `clients/${clientId}/memoria/${memoriaFile.name}`,
                (p) => setUploadProgress(prog => ({...prog, memoria: p}))
            );
        }
        if (planosFile) {
            submissionData.planos = await uploadFile(
                planosFile,
                `clients/${clientId}/planos/${planosFile.name}`,
                (p) => setUploadProgress(prog => ({...prog, planos: p}))
            );
        }

        delete submissionData.memoriaFile;
        delete submissionData.planosFile;
        
        await onSubmit(submissionData);
        onOpenChange(false);
    } catch (error) {
        toast({ variant: 'destructive', title: "Error al subir archivo", description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
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
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subsección</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? 'General'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una subsección" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                 <FileUploader form={form} fieldName="memoriaFile" currentUrl={client?.memoria} label="Memoria" disabled={isSaving} onFileSelect={setMemoriaFile} />
                 <FileUploader form={form} fieldName="planosFile" currentUrl={client?.planos} label="Planos" disabled={isSaving} onFileSelect={setPlanosFile} />
            </div>
             {(uploadProgress.memoria > 0 || uploadProgress.planos > 0) && (
                <div className="space-y-2">
                    {uploadProgress.memoria > 0 && <div><Label>Subiendo memoria...</Label><Progress value={uploadProgress.memoria} /></div>}
                    {uploadProgress.planos > 0 && <div><Label>Subiendo planos...</Label><Progress value={uploadProgress.planos} /></div>}
                </div>
            )}

            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {client ? "Guardar Cambios" : "Guardar Obra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientListCard({ clients, onAddClient, onUpdateClient, onDeleteClient, providers, onCreateBudgetFromClient, onCreateSeguimientoFromClient, categories }: { clients: Client[], onAddClient: (client: any) => Promise<void>, onUpdateClient: (client: any) => Promise<void>, onDeleteClient: (id: string) => void, providers: any[], onCreateBudgetFromClient: (client: any, category: BudgetCategory) => void, onCreateSeguimientoFromClient: (client: any) => void, categories: string[] }) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [activeClient, setActiveClient] = useState<Client | undefined>(undefined);
  const [viewingInfo, setViewingInfo] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleEdit = (client: Client) => {
    setActiveClient(client);
    setFormOpen(true);
  }
  
  const handleAdd = () => {
    setActiveClient(undefined);
    setFormOpen(true);
  }

  const handlePriorityChange = (client: Client, priority: number) => {
    const newPriority = client.priority === priority ? null : priority;
    onUpdateClient({ ...client, priority: newPriority });
  };

  const handleSubmit = async (values: any) => {
    if (activeClient) {
      await onUpdateClient(values);
    } else {
      await onAddClient(values);
    }
  };

  const groupedClients = useMemo(() => {
    let filteredClients = [...clients];

    if (priorityFilter !== null) {
      filteredClients = filteredClients.filter(c => c.priority === priorityFilter);
    }

    if (categoryFilter !== null) {
      filteredClients = filteredClients.filter(c => (c.category || 'General') === categoryFilter);
    }

    const groups: { [key: string]: Client[] } = {};
    categories.forEach(cat => {
      groups[cat] = [];
    });
    if (!groups['General']) {
      groups['General'] = [];
    }

    filteredClients.forEach(client => {
      const categoryKey = client.category || 'General';
      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(client);
    });

    return groups;
  }, [clients, priorityFilter, categoryFilter, categories]);

  const handleFilterClick = (priority: number) => {
    setPriorityFilter(prev => (prev === priority ? null : priority));
  };


  return (
    <Card>
      <Dialog open={!!viewingInfo} onOpenChange={() => setViewingInfo(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Información Adicional</DialogTitle></DialogHeader>
            <div className="py-4 whitespace-pre-wrap">{viewingInfo}</div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <ClientForm client={activeClient} onSubmit={handleSubmit} open={isFormOpen} onOpenChange={setFormOpen} providers={providers} categories={categories} />
      
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Obra Nueva</CardTitle>
          <CardDescription>Gestiona tus proyectos de obra nueva.</CardDescription>
        </div>
        <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Obra</Button>
      </CardHeader>
      
      <div className="flex flex-wrap items-center gap-4 px-6 pb-4 border-b">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Prioridad:</span>
            {[1, 2, 3].map((p) => (
            <Button
                key={p}
                variant={priorityFilter === p ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 rounded-full"
                onClick={() => handleFilterClick(p)}
            >
                {p}
            </Button>
            ))}
            {priorityFilter !== null && (
                <Button variant="ghost" size="sm" onClick={() => setPriorityFilter(null)}>
                    Limpiar
                </Button>
            )}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Subsección:</span>
            <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por subsección..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Mostrar Todas</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <CardContent className="pt-6">
        <Accordion type="multiple" className="w-full space-y-4">
          {Object.entries(groupedClients).map(([category, clientsInGroup]) => {
            if (clientsInGroup.length === 0 && categoryFilter !== null) return null;
            return (
                <AccordionItem value={category} key={category} className="border-b-0">
                    <AccordionTrigger className="text-xl font-semibold p-2 rounded-md bg-secondary/50 hover:bg-secondary">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            {category} ({clientsInGroup.length})
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      {clientsInGroup.length > 0 ? clientsInGroup.map(client => {
                        const provider = providers.find(p => p.id === client.providerId);
                        return (
                          <Accordion key={client.id} type="single" collapsible>
                            <AccordionItem value={client.id} className="border-none">
                               <Card className="flex flex-col overview-card">
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                    <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                                      <div className="text-left">
                                        <h3 className="font-semibold text-lg">{client.name}</h3>
                                      </div>
                                    </AccordionTrigger>
                                    <AlertDialog>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem onSelect={() => handleEdit(client)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                          <DropdownMenuItem onSelect={() => onCreateSeguimientoFromClient(client)}><Repeat className="mr-2"/>Añadir a Seguimiento</DropdownMenuItem>
                                           <DropdownMenuSub>
                                                <DropdownMenuSubTrigger><Move className="mr-2 h-4 w-4" /> Mover a Subsección</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    {categories.map(cat => (
                                                        <DropdownMenuItem key={cat} onSelect={() => onUpdateClient({ ...client, category: cat })}>
                                                            {cat}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
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
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">Prioridad:</h4>
                                      {[1, 2, 3].map((p) => (
                                        <Button
                                          key={p}
                                          variant={client.priority === p ? 'default' : 'outline'}
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() => handlePriorityChange(client, p)}
                                        >
                                          {p}
                                        </Button>
                                      ))}
                                    </div>
                                    <Separator />
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
                          </Accordion>
                        )
                      }) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            No hay clientes en esta subsección.
                        </div>
                      )}
                  </AccordionContent>
                </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
