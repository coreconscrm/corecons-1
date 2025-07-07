"use client"

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Pencil } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const contactSchema = z.object({
  type: z.enum(["Obra Nueva", "Reforma", "Otro tipo"], { required_error: "Debe seleccionar un tipo." }),
  active: z.boolean().default(true),
  project: z.boolean().default(false),
  license: z.boolean().default(false),
  name: z.string().min(1, "El nombre es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  email: z.string().email("Email inválido."),
  location: z.string().min(1, "La ubicación es requerida."),
  called: z.boolean().default(false),
  status: z.string().default('Pendiente'),
});

type Contact = z.infer<typeof contactSchema> & { id: string };

function ContactForm({ contact, onSubmit, open, onOpenChange }: { contact?: Contact, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {
      type: "Reforma",
      active: true,
      project: false,
      license: false,
      name: "",
      phone: "",
      email: "",
      location: "",
      called: false,
      status: "Pendiente"
    },
  });

  const handleSubmit = (values: z.infer<typeof contactSchema>) => {
    onSubmit({ ...contact, ...values });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>{contact ? "Editar Contacto" : "Añadir Nuevo Contacto"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="600 000 000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="juan@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
               </div>
               <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Ciudad, Dirección" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
               <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Solicitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Obra Nueva">Obra Nueva</SelectItem>
                        <SelectItem value="Reforma">Reforma</SelectItem>
                        <SelectItem value="Otro tipo">Otro tipo</SelectItem>
                    </SelectContent>
                    </Select><FormMessage />
                </FormItem>
              )} />
              <div className="flex items-center space-x-6">
                  <FormField control={form.control} name="active" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Activo</FormLabel></FormItem>
                  )} />
                  <FormField control={form.control} name="project" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Proyecto</FormLabel></FormItem>
                  )} />
                  <FormField control={form.control} name="license" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Licencia</FormLabel></FormItem>
                  )} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                <Button type="submit">{contact ? "Guardar Cambios" : "Añadir Contacto"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
    </Dialog>
  )
}

export function FormsResponsesCard({
  contacts, onAddContact, onUpdateContact, onDeleteContact,
  forms, onLoadForms, onUpdateForm, onDeleteForm
}: {
  contacts: any[], onAddContact: (c: any) => void, onUpdateContact: (c: any) => void, onDeleteContact: (id: string) => void,
  forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void
}) {
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          toast({ variant: 'destructive', title: "Error al leer el CSV", description: results.errors.map(e => e.message).join(', ') });
          return;
        }
        if (results.data.length === 0) {
             toast({ variant: 'destructive', title: "Archivo vacío o inválido", description: "El CSV no contiene datos o tiene un formato incorrecto." });
             return;
        }
        onLoadForms(results.data as any[]);
      },
      error: (error) => toast({ variant: 'destructive', title: "Error al leer el archivo", description: error.message })
    });

    if (event.target) event.target.value = "";
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  
  const getCsvHeaders = () => {
    if (forms.length === 0) return [];
    const allKeys = forms.reduce((keys, form) => {
        Object.keys(form).forEach(key => { if (!keys.includes(key)) keys.push(key); });
        return keys;
    }, [] as string[]);
    return allKeys.filter(h => h !== 'id' && h !== 'called' && h !== 'status');
  }

  const csvHeaders = getCsvHeaders();

  return (
    <Card>
      {editingContact && <ContactForm contact={editingContact} onSubmit={onUpdateContact} open={!!editingContact} onOpenChange={() => setEditingContact(undefined)} />}
      <ContactForm onSubmit={onAddContact} open={isFormOpen} onOpenChange={setIsFormOpen} />

      <CardHeader>
        <CardTitle>Contactos y Formularios</CardTitle>
        <CardDescription>Gestiona contactos manualmente o carga respuestas desde un archivo CSV.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Manual Contacts Section */}
        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-semibold">Contactos Manuales</h3>
            <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/>Añadir Contacto</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead>Llamado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length > 0 ? contacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell className="hidden sm:table-cell">{contact.email}</TableCell>
                    <TableCell className="hidden md:table-cell"><span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{contact.type}</span></TableCell>
                    <TableCell><Checkbox checked={contact.called} onCheckedChange={(checked) => onUpdateContact({ ...contact, called: !!checked })} /></TableCell>
                    <TableCell>
                      <Select value={contact.status} onValueChange={(status) => onUpdateContact({ ...contact, status })}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Contactado">Contactado</SelectItem>
                          <SelectItem value="En proceso">En proceso</SelectItem>
                          <SelectItem value="Firmado">Firmado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => setEditingContact(contact)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                              <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteContact(contact.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">No hay contactos manuales.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* CSV Forms Section */}
        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                  <h3 className="text-lg font-semibold">Respuestas de Formularios (CSV)</h3>
                  <p className="text-sm text-muted-foreground">Carga un archivo CSV con las respuestas para visualizarlas.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                  <Button onClick={triggerFileUpload}><Upload className="mr-2 h-4 w-4"/>Cargar CSV</Button>
                  <Button variant="outline" asChild><a href={formUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir Formulario</a></Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden"/>
              </div>
          </div>
          {forms.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Llamado</TableHead>
                              <TableHead>Estado</TableHead>
                              {csvHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                              <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {forms.map(sub => (
                          <TableRow key={sub.id}>
                              <TableCell><Checkbox checked={sub.called} onCheckedChange={(checked) => onUpdateForm({ ...sub, called: !!checked })}/></TableCell>
                              <TableCell>
                                  <Select value={sub.status} onValueChange={(status) => onUpdateForm({ ...sub, status })}>
                                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                                          <SelectItem value="Contactado">Contactado</SelectItem>
                                          <SelectItem value="En proceso">En proceso</SelectItem>
                                          <SelectItem value="Firmado">Firmado</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </TableCell>
                              {csvHeaders.map(header => (
                                  <TableCell key={`${sub.id}-${header}`} className="max-w-[200px] truncate" title={sub[header]}>{sub[header]}</TableCell>
                              ))}
                              <TableCell className="text-right">
                              <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la respuesta del formulario.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteForm(sub.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
              </ScrollArea>
          ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No hay datos de CSV cargados</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                      Carga un archivo CSV para empezar a ver las respuestas aquí.
                  </p>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
