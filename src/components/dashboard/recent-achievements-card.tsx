"use client"

import { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Pencil, Link, Unlink, UserPlus } from "lucide-react";
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

type Contact = z.infer<typeof contactSchema> & { id: string, [key: string]: any };

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

  // When a contact is passed for editing, make sure to reset the form with its values
  useEffect(() => {
    if (contact) {
      form.reset({
        type: contact.type || "Reforma",
        active: contact.active ?? true,
        project: contact.project ?? false,
        license: contact.license ?? false,
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        location: contact.location || '',
        called: contact.called ?? false,
        status: contact.status || 'Pendiente'
      });
    } else {
       form.reset({
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
      });
    }
  }, [contact, form, open]);


  const handleSubmit = (values: z.infer<typeof contactSchema>) => {
    // This preserves extra fields that are not in the form
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

function GoogleSheetDialog({ open, onOpenChange, currentUrl, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, currentUrl: string, onSave: (url: string) => void }) {
    const [url, setUrl] = useState(currentUrl);
    useEffect(() => { setUrl(currentUrl) }, [currentUrl, open]);

    const handleSave = () => {
        onSave(url);
        onOpenChange(false);
    };
    
    const handleDisconnect = () => {
        onSave('');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Conectar con Google Sheets</DialogTitle>
                    <DialogDescription>Pega la URL publicada de tu hoja para sincronizar los datos automáticamente.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="text-sm p-3 bg-secondary/50 rounded-md border border-border/50">
                        <p className="font-semibold mb-2">¿Cómo obtener la URL?</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                            <li>En Google Sheets, ve a <code className="bg-muted px-1 py-0.5 rounded">Archivo &gt; Compartir &gt; Publicar en la web</code>.</li>
                            <li>Selecciona la hoja correcta que quieres conectar.</li>
                            <li>En el segundo desplegable, elige <code className="bg-muted px-1 py-0.5 rounded">Valores separados por comas (.csv)</code>.</li>
                            <li>Haz clic en "Publicar" y copia la URL generada.</li>
                        </ol>
                    </div>
                    <Input 
                        placeholder="Pega la URL aquí..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
                    {currentUrl ? (
                         <Button variant="destructive" onClick={handleDisconnect}><Unlink className="mr-2" />Desconectar</Button>
                    ) : <div></div>}
                   
                    <div className="flex gap-2 justify-end">
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button onClick={handleSave}>Guardar Conexión</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function FormsResponsesCard({
  contacts, onAddContact, onUpdateContact, onDeleteContact,
  forms, onLoadForms, onUpdateForm, onDeleteForm,
  sheetUrl, onSaveSheetUrl
}: {
  contacts: any[], onAddContact: (c: any) => void, onUpdateContact: (c: any) => void, onDeleteContact: (id: string) => void,
  forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
  sheetUrl: string, onSaveSheetUrl: (url: string) => void
}) {
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [viewingText, setViewingText] = useState<string | null>(null);

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

  const handlePromoteToContact = (formRow: any) => {
    const { id, ...data } = formRow; 
    const contactName = data.name || data.Nombre || data.nombre || 'un contacto';
    
    const newContactPayload = {
      ...data,
      called: data.called ?? false,
      status: data.status ?? 'Pendiente',
    };

    onAddContact(newContactPayload);
    toast({ title: "Contacto añadido", description: `"${contactName}" ha sido guardado en tus contactos.` });
  };
  
  const getContactHeaders = () => {
    if (!contacts || contacts.length === 0) return [];
    const allKeys = new Set<string>();
    contacts.forEach(contact => {
      Object.keys(contact).forEach(key => allKeys.add(key));
    });
    allKeys.delete('id');
    
    const keyArray = Array.from(allKeys);
    const preferredOrder = ['name', 'Nombre', 'phone', 'Teléfono', 'email', 'Email', 'status', 'called'];
    keyArray.sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
    return keyArray;
  };
  
  const contactHeaders = getContactHeaders();

  return (
    <Card>
      <Dialog open={!!viewingText} onOpenChange={() => setViewingText(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Texto Completo</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4">
                 <div className="whitespace-pre-wrap break-words pr-4">
                    {viewingText}
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button variant="outline" onClick={() => setViewingText(null)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactForm 
        contact={editingContact} 
        onSubmit={editingContact ? onUpdateContact : onAddContact} 
        open={isFormOpen} 
        onOpenChange={(open) => {
          if(!open) setEditingContact(undefined);
          setIsFormOpen(open);
        }} 
      />
      <GoogleSheetDialog 
        open={isSheetDialogOpen}
        onOpenChange={setIsSheetDialogOpen}
        currentUrl={sheetUrl}
        onSave={onSaveSheetUrl}
      />


      <CardHeader>
        <CardTitle>Contactos y Formularios</CardTitle>
        <CardDescription>Gestiona contactos manualmente o carga respuestas desde un archivo CSV.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Manual Contacts Section */}
        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-semibold">Contactos Manuales</h3>
            <Button onClick={() => { setEditingContact(undefined); setIsFormOpen(true); }} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/>Añadir Contacto</Button>
          </div>
          <div className="rounded-md border">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {contactHeaders.map(header => <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>)}
                    <TableHead className="text-right sticky right-0 bg-card">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length > 0 ? contacts.map(contact => (
                    <TableRow key={contact.id}>
                      {contactHeaders.map(header => {
                        const value = contact[header];
                        return (
                          <TableCell key={`${contact.id}-${header}`} className="max-w-[200px]">
                            {(() => {
                                if (header === 'called') {
                                    return <Checkbox checked={!!value} onCheckedChange={(checked) => onUpdateContact({ ...contact, called: !!checked })} />;
                                }
                                if (header === 'status') {
                                    return (
                                        <Select value={value || 'Pendiente'} onValueChange={(status) => onUpdateContact({ ...contact, status })}>
                                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                <SelectItem value="Contactado">Contactado</SelectItem>
                                                <SelectItem value="En proceso">En proceso</SelectItem>
                                                <SelectItem value="Firmado">Firmado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    );
                                }
                                if (typeof value === 'boolean') {
                                    return <Checkbox checked={value} disabled />;
                                }
                                
                                const textValue = value?.toString() || '';
                                const isLongText = textValue.length > 50;

                                if (isLongText) {
                                    return (
                                        <div className="truncate cursor-pointer hover:underline" onClick={() => setViewingText(textValue)}>
                                            {textValue}
                                        </div>
                                    );
                                }
                                return textValue;
                            })()}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right sticky right-0 bg-card">
                         <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => {setEditingContact(contact); setIsFormOpen(true);}}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
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
                    <TableRow><TableCell colSpan={contactHeaders.length + 1} className="text-center h-24">No hay contactos manuales.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        <Separator />

        {/* CSV Forms Section */}
        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                  <h3 className="text-lg font-semibold">Respuestas de Formularios</h3>
                  <p className="text-sm text-muted-foreground">Carga un CSV o conecta una hoja de Google Sheets.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                  <Button onClick={triggerFileUpload}><Upload className="mr-2 h-4 w-4"/>Cargar CSV</Button>
                  <Button variant="outline" onClick={() => setIsSheetDialogOpen(true)}><Link className="mr-2 h-4 w-4"/>{sheetUrl ? "Cambiar Sheet" : "Conectar Sheet"}</Button>
                  <Button variant="outline" asChild><a href={formUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir Formulario</a></Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden"/>
              </div>
          </div>
          {forms.length > 0 ? (
              <ScrollArea className="w-full rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Llamado</TableHead>
                              <TableHead>Estado</TableHead>
                              {csvHeaders.map(header => <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>)}
                              <TableHead className="text-right sticky right-0 bg-card">Acciones</TableHead>
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
                              {csvHeaders.map(header => {
                                const textValue = sub[header]?.toString() || '';
                                const isLongText = textValue.length > 50;
                                return (
                                    <TableCell key={`${sub.id}-${header}`} className="max-w-[200px]">
                                        {isLongText ? (
                                            <div className="truncate cursor-pointer hover:underline" onClick={() => setViewingText(textValue)}>
                                                {textValue}
                                            </div>
                                        ) : (
                                            textValue
                                        )}
                                    </TableCell>
                                );
                              })}
                              <TableCell className="text-right sticky right-0 bg-card">
                              <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon" title="Añadir a contactos" onClick={() => handlePromoteToContact(sub)}>
                                    <UserPlus size={16} />
                                </Button>
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
                              </div>
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
                  <h3 className="mt-4 text-lg font-semibold">No hay datos de formularios</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                      Carga un CSV o conecta una hoja de Google Sheets para ver las respuestas.
                  </p>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
