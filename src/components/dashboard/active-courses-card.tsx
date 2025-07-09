"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
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
import { UserPlus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Badge } from "@/components/ui/badge";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  contact: z.string().min(1, "El nombre de contacto es requerido."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  arquitecto: z.string().optional(),
  providerId: z.string().optional(),
  estado: z.enum(["Contactado", "En Progreso", "En Licencia", "Firmado", "En Construcción", "Finalizado"], {
    required_error: "Debe seleccionar un estado."
  }),
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
            {!clientId && <p className="text-xs text-muted-foreground">Guarda el cliente para poder subir archivos.</p>}
            <FormMessage />
        </FormItem>
    );
}


function ClientForm({ client, onSubmit, onOpenChange, open, providers }: { client?: Client, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, providers: any[] }) {
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", contact: "", email: "", phone: "", estado: "Contactado", arquitecto: "", providerId: "", infoAdicional: "", memoria: "", planos: "" },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset(client);
      } else {
        form.reset({ name: "", contact: "", email: "", phone: "", estado: "Contactado", arquitecto: "", providerId: "", infoAdicional: "", memoria: "", planos: "" });
      }
    }
  }, [client, open, form]);

  const handleSubmit = (values: z.infer<typeof clientSchema>) => {
    onSubmit({ ...client, ...values });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Añadir Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre del Proyecto</FormLabel><FormControl><Input placeholder="Proyecto de reforma" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contact" render={({ field }) => (
                <FormItem><FormLabel>Persona de Contacto</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="arquitecto" render={({ field }) => (
                    <FormItem><FormLabel>Arquitecto</FormLabel><FormControl><Input placeholder="Nombre del arquitecto" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="providerId" render={({ field }) => (
                    <FormItem><FormLabel>Proveedor Asignado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un proveedor" /></SelectTrigger></FormControl>
                            <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="estado" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado del Proyecto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
             <FormField control={form.control} name="infoAdicional" render={({ field }) => (
                <FormItem><FormLabel>Información Adicional</FormLabel><FormControl><Textarea placeholder="Añade detalles importantes..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploader form={form} fieldName="memoria" clientId={client?.id} label="Memoria" />
                <FileUploader form={form} fieldName="planos" clientId={client?.id} label="Planos" />
            </div>

            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{client ? "Guardar Cambios" : "Guardar Cliente"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ViewClientDialog({ client, providers, open, onOpenChange }: { client: Client | null, providers: any[], open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!client) return null;
    const provider = providers.find(p => p.id === client.providerId);
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{client.name}</DialogTitle>
                    <DialogDescription>Contacto: {client.contact}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex justify-between"><strong>Teléfono:</strong> <span>{client.phone}</span></div>
                    <div className="flex justify-between"><strong>Email:</strong> <span>{client.email}</span></div>
                    <div className="flex justify-between"><strong>Arquitecto:</strong> <span>{client.arquitecto || 'N/A'}</span></div>
                    <div className="flex justify-between"><strong>Proveedor:</strong> <span>{provider?.name || 'N/A'}</span></div>
                    <div className="flex justify-between items-center"><strong>Estado:</strong> <Badge>{client.estado}</Badge></div>
                    <div>
                        <h4 className="font-semibold mb-1">Info Adicional:</h4>
                        <p className="p-2 bg-muted rounded-md text-muted-foreground">{client.infoAdicional || 'No hay información adicional.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <a href={client.memoria || '#'} target="_blank" rel="noopener noreferrer" className={!client.memoria ? 'pointer-events-none' : ''}>
                            <Button className="w-full" disabled={!client.memoria}><FileText className="mr-2"/> Memoria</Button>
                        </a>
                        <a href={client.planos || '#'} target="_blank" rel="noopener noreferrer" className={!client.planos ? 'pointer-events-none' : ''}>
                             <Button className="w-full" disabled={!client.planos}><FileText className="mr-2"/> Planos</Button>
                        </a>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ClientListCard({ clients, onAddClient, onUpdateClient, onDeleteClient, providers }: { clients: Client[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: string) => void, providers: any[] }) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

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
      <ClientForm client={editingClient} onSubmit={editingClient ? onUpdateClient : onAddClient} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} providers={providers} />
      <ViewClientDialog client={viewingClient} providers={providers} open={!!viewingClient} onOpenChange={() => setViewingClient(null)} />
      
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Gestiona tus clientes y potenciales clientes.</CardDescription>
        </div>
        <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Cliente</Button>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell><Badge variant="secondary">{client.estado}</Badge></TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setViewingClient(client)}><Eye className="mr-2"/>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEdit(client)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                          <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteClient(client.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
