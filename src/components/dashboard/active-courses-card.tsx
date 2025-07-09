"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Upload, Loader2, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Textarea } from "../ui/textarea";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido."),
  contact: z.string().min(1, "El nombre de contacto es requerido."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  origin: z.enum(["Email", "Recomendado", "Formulario", "Redes", "Otros"], { required_error: "Debe seleccionar un origen." }),
  architect: z.string().optional(),
  providerId: z.string().optional(),
  status: z.enum(["Contactado", "En Progreso", "En Licencia", "Firmado", "En Construcción", "Finalizado"]),
  info: z.string().optional(),
  projectDoc: z.string().optional(),
  memoryDoc: z.string().optional(),
  plansDoc: z.string().optional(),
});

type Client = z.infer<typeof clientSchema> & { id: string };

function FileUploadButton({ form, fieldName, clientId }: { form: any, fieldName: 'projectDoc' | 'memoryDoc' | 'plansDoc', clientId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const currentUrl = form.getValues(fieldName);
    if (currentUrl) {
      // Intenta extraer el nombre del archivo de la URL
      try {
        const url = new URL(currentUrl);
        const path = decodeURIComponent(url.pathname);
        const name = path.substring(path.lastIndexOf('/') + 1);
        setFileName(name.split('_').pop() || 'Archivo');
      } catch (e) {
        setFileName('Archivo');
      }
    } else {
        setFileName(null);
    }
  }, [form, fieldName]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && clientId) {
      setIsUploading(true);
      const storageRef = ref(storage, `clients/${clientId}/docs/${fieldName}_${file.name}`);
      try {
        const snapshot = await uploadBytesResumable(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        form.setValue(fieldName, downloadURL, { shouldValidate: true });
        setFileName(file.name);
        toast({ title: "Archivo subido", description: `${file.name} se ha subido correctamente.` });
      } catch (error) {
        toast({ variant: 'destructive', title: "Error al subir", description: `No se pudo subir el archivo. Error: ${(error as Error).message}` });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const currentFileUrl = form.getValues(fieldName);

  return (
    <div className="flex items-center gap-2">
      <Input
        id={`${fieldName}-${clientId}`}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      <label htmlFor={`${fieldName}-${clientId}`} className="w-full">
        <Button asChild variant="outline" className="w-full justify-start" disabled={isUploading}>
          <div>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {fileName ? (fileName.substring(0,20)) : `Subir ${fieldName.replace('Doc', '')}`}
          </div>
        </Button>
      </label>
      {currentFileUrl && (
        <Button variant="ghost" size="icon" asChild>
          <a href={currentFileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4"/></a>
        </Button>
      )}
    </div>
  );
}

function ClientForm({ client, providers, onSubmit, onOpenChange, open }: { client?: Client, providers: any[], onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {
      name: "",
      contact: "",
      email: "",
      phone: "",
      origin: "Formulario",
      status: "Contactado",
      architect: "",
      providerId: "",
      info: "",
      projectDoc: "",
      memoryDoc: "",
      plansDoc: ""
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(client ? { ...client } : {
        name: "",
        contact: "",
        email: "",
        phone: "",
        origin: "Formulario",
        status: "Contactado",
        architect: "",
        providerId: "",
        info: "",
        projectDoc: "",
        memoryDoc: "",
        plansDoc: ""
      });
    }
  }, [client, open, form]);


  const handleSubmit = (values: z.infer<typeof clientSchema>) => {
    onSubmit({ ...client, ...values });
    form.reset();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Oportunidad" : "Añadir Nueva Oportunidad"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre del Proyecto</FormLabel><FormControl><Input placeholder="Reforma integral en Gracia" {...field} /></FormControl><FormMessage /></FormItem>
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
              <FormField control={form.control} name="origin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen del Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un origen" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Recomendado">Recomendado</SelectItem>
                      <SelectItem value="Formulario">Formulario</SelectItem>
                      <SelectItem value="Redes">Redes</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="architect" render={({ field }) => (
                <FormItem><FormLabel>Arquitecto</FormLabel><FormControl><Input placeholder="Lucía Gómez" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="providerId" render={({ field }) => (
                <FormItem><FormLabel>Proveedor Asignado</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="info" render={({ field }) => (
                <FormItem><FormLabel>Info Adicional</FormLabel><FormControl><Textarea placeholder="Detalles sobre la oportunidad, requerimientos especiales..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div>
              <FormLabel>Documentación</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <FileUploadButton form={form} fieldName="projectDoc" clientId={client?.id || 'new'}/>
                  <FileUploadButton form={form} fieldName="memoryDoc" clientId={client?.id || 'new'}/>
                  <FileUploadButton form={form} fieldName="plansDoc" clientId={client?.id || 'new'}/>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{client ? "Guardar Cambios" : "Guardar Oportunidad"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientListCard({ clients, providers, onAddClient, onUpdateClient, onDeleteClient }: { clients: Client[], providers: any[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: string) => void }) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  return (
    <Card>
      {editingClient && <ClientForm client={editingClient} providers={providers} onSubmit={onUpdateClient} open={!!editingClient} onOpenChange={() => setEditingClient(undefined)} />}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Oportunidades y Proyectos</CardTitle>
            <CardDescription>Gestiona las oportunidades desde el contacto inicial hasta la finalización.</CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir Oportunidad</Button>
          </DialogTrigger>
        </CardHeader>
        <ClientForm providers={providers} onSubmit={onAddClient} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
      </Dialog>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell>{client.origin}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                       {client.projectDoc && <a href={client.projectDoc} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5 text-primary"/></a>}
                       {client.memoryDoc && <a href={client.memoryDoc} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5 text-primary"/></a>}
                       {client.plansDoc && <a href={client.plansDoc} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5 text-primary"/></a>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setEditingClient(client)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                          <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la oportunidad.</AlertDialogDescription></AlertDialogHeader>
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
