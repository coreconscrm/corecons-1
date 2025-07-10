
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
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Pencil, Link, Unlink, UserPlus, ListFilter, ArrowRightCircle, Star } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const contactSchema = z.record(z.any());

type Contact = z.infer<typeof contactSchema> & { id: string };

function ContactForm({ contact, onSubmit, open, onOpenChange, entityName = 'Contacto' }: { contact?: Contact, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, entityName?: string }) {
  const form = useForm<Contact>({
    resolver: zodResolver(contactSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (open && contact) {
      form.reset(contact);
    } else if (open && !contact) {
      form.reset({ name: "", phone: "", email: "" });
    }
  }, [contact, open, form]);
  
  const handleSubmit = (values: Contact) => {
    onSubmit({ ...contact, ...values });
    form.reset();
    onOpenChange(false);
  };

  const fieldsToRender = open ? (contact ? Object.keys(contact).filter(key => key !== 'id') : ['name', 'phone', 'email']) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{contact ? `Editar ${entityName}` : `Añadir Nuevo ${entityName}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto pr-6 -mr-6">
             {fieldsToRender.map((fieldName) => {
                const value = form.getValues(fieldName) as string | number | undefined | boolean;
                const isLongText = typeof value === 'string' && value.length > 50;
                const Component = isLongText ? Textarea : Input;

                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">{fieldName.replace(/_/g, ' ')}</FormLabel>
                        <FormControl>
                          <Component
                            placeholder={`Introduce ${fieldName.replace(/_/g, ' ')}...`}
                            {...field}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{contact ? `Guardar Cambios` : `Añadir ${entityName}`}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function GoogleSheetDialog({ open, onOpenChange, currentUrl, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, currentUrl: string, onSave: (url: string) => void }) {
    const [url, setUrl] = useState(currentUrl);

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
                            <li>En Google Sheets, ve a <code className="bg-muted px-1 py-0.5 rounded">Archivo > Compartir > Publicar en la web</code>.</li>
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

function DynamicTableCard({
    title,
    description,
    data,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onPromoteItem,
    entityName
} : {
    title: string;
    description: string;
    data: any[];
    onAddItem: (item: any) => void;
    onUpdateItem: (item: any) => void;
    onDeleteItem: (id: string) => void;
    onPromoteItem: (item: any) => void;
    entityName: string;
}) {
    const [editingItem, setEditingItem] = useState<Contact | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
    const [viewingText, setViewingText] = useState<string | null>(null);

    const getHeaders = () => {
        if (!data || data.length === 0) return [];
        const allKeys = new Set<string>();
        data.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
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

    const headers = getHeaders();

    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        headers.forEach(header => {
            if (columnVisibility[header] === undefined) {
                initialVisibility[header] = true;
            }
        });
        setColumnVisibility(prev => ({ ...initialVisibility, ...prev }));
    }, [data]);

    const visibleHeaders = headers.filter(header => columnVisibility[header]);

    return (
        <Card>
            <ContactForm 
                contact={editingItem} 
                onSubmit={editingItem ? onUpdateItem : onAddItem} 
                open={isFormOpen} 
                onOpenChange={(open) => {
                    if (!open) setEditingItem(undefined);
                    setIsFormOpen(open);
                }}
                entityName={entityName}
            />
             <Dialog open={!!viewingText} onOpenChange={() => setViewingText(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Texto Completo</DialogTitle></DialogHeader>
                    <ScrollArea className="max-h-[60vh] my-4">
                        <div className="whitespace-pre-wrap break-words pr-4">{viewingText}</div>
                    </ScrollArea>
                    <DialogFooter><Button variant="outline" onClick={() => setViewingText(null)}>Cerrar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <CardHeader>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                     <div className='flex items-center gap-2'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mostrar Columnas</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {headers.map((header) => (
                                    <DropdownMenuCheckboxItem key={header} className="capitalize" checked={columnVisibility[header] ?? true} onCheckedChange={(value) => setColumnVisibility((prev) => ({ ...prev, [header]: value }))}>
                                        {header.replace(/_/g, ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Añadir {entityName}</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <ScrollArea className="w-full">
                        <Table>
                            <TableHeader><TableRow>
                                {visibleHeaders.map(header => <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>)}
                                <TableHead className="text-right sticky right-0 bg-card">Acciones</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {data.length > 0 ? data.map(item => (
                                    <TableRow key={item.id}>
                                        {visibleHeaders.map(header => (
                                            <TableCell key={`${item.id}-${header}`} className="max-w-[200px]">
                                                {(() => {
                                                    const value = item[header];
                                                    if (header === 'called') return <Checkbox checked={!!value} onCheckedChange={(checked) => onUpdateItem({ ...item, called: !!checked })} />;
                                                    if (header === 'status') return (
                                                        <Select value={value || 'Pendiente'} onValueChange={(status) => onUpdateItem({ ...item, status })}>
                                                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                                <SelectItem value="Contactado">Contactado</SelectItem>
                                                                <SelectItem value="En proceso">En proceso</SelectItem>
                                                                <SelectItem value="Firmado">Firmado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                    const textValue = value?.toString() || '';
                                                    return textValue.length > 50 ? <div className="truncate cursor-pointer hover:underline" onClick={() => setViewingText(textValue)}>{textValue}</div> : textValue;
                                                })()}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right sticky right-0 bg-card">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => onPromoteItem(item)}><ArrowRightCircle className="mr-2" />Promover a Proyecto</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => { setEditingItem(item); setIsFormOpen(true); }}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente este registro.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteItem(item.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={visibleHeaders.length + 1} className="text-center h-24">No hay datos.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

function MainFormsCard({
  onAddClient, onAddReforma,
  forms, onLoadForms, onUpdateForm, onDeleteForm,
  sheetUrl, onSaveSheetUrl,
  onAddPriorityCall
}: {
  onAddClient: (client: any) => void, onAddReforma: (reforma: any) => void,
  forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
  sheetUrl: string, onSaveSheetUrl: (url: string) => void,
  onAddPriorityCall: (call: any) => void
}) {
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [viewingText, setViewingText] = useState<string | null>(null);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);

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

    onAddClient(newContactPayload);
    onDeleteForm(id);
    toast({ title: "Contacto añadido", description: `"${contactName}" ha sido guardado en tus contactos.` });
  };
  
  const handleAddToPriority = (formRow: any) => {
    const { id, ...data } = formRow;
    const contactName = data.name || data.Nombre || data.nombre || 'un contacto';
    
    onAddPriorityCall(data);
    onDeleteForm(id);
    toast({ title: "Movido a Prioritarias", description: `"${contactName}" se ha añadido a la lista de llamadas prioritarias.` });
  };

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
      
      <GoogleSheetDialog 
        open={isSheetDialogOpen}
        onOpenChange={setIsSheetDialogOpen}
        currentUrl={sheetUrl}
        onSave={onSaveSheetUrl}
      />


      <CardHeader>
        <CardTitle>Respuestas de Formularios</CardTitle>
        <CardDescription>Gestiona las respuestas de tus formularios de Google o de un archivo CSV.</CardDescription>
      </CardHeader>

      <CardContent>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                  <h3 className="text-lg font-semibold">Cargar y Sincronizar</h3>
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
                               <AlertDialog>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onSelect={() => handleAddToPriority(sub)}><Star className="mr-2"/>Añadir a Prioritarias</DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => handlePromoteToContact(sub)}><UserPlus className="mr-2"/>Guardar como Contacto</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                  <h3 className="mt-4 text-lg font-semibold">No hay datos de formularios</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                      Carga un CSV o conecta una hoja de Google Sheets para ver las respuestas.
                  </p>
              </div>
          )}
      </CardContent>
    </Card>
  );
}

export function FormsSection({
  contacts, onAddContact, onUpdateContact, onDeleteContact,
  onAddClient, onAddReforma,
  forms, onLoadForms, onUpdateForm, onDeleteForm,
  sheetUrl, onSaveSheetUrl,
  priorityCalls, onAddPriorityCall, onUpdatePriorityCall, onDeletePriorityCall
}: {
  contacts: any[], onAddContact: (c: any) => void, onUpdateContact: (c: any) => void, onDeleteContact: (id: string) => void,
  onAddClient: (client: any) => void, onAddReforma: (reforma: any) => void,
  forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
  sheetUrl: string, onSaveSheetUrl: (url: string) => void,
  priorityCalls: any[], onAddPriorityCall: (call: any) => void, onUpdatePriorityCall: (call: any) => void, onDeletePriorityCall: (id: string) => void
}) {
  const [promotingContact, setPromotingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const handlePromoteToProject = (section: 'clients' | 'reformas') => {
    if (!promotingContact) return;

    const { id, ...data } = promotingContact;
    const contactName = data.name || data.Nombre || data.nombre || 'Nuevo Proyecto desde Contacto';

    const newProjectData = {
        name: contactName,
        contact: contactName,
        phone: data.phone || data.Phone || data.Teléfono || '',
        email: data.email || data.Email || '',
        estado: 'Contactado',
        infoAdicional: 'Promovido desde Contactos Manuales.',
        arquitecto: '',
        providerId: '',
        memoria: '',
        planos: '',
    };
    
    if (section === 'clients') {
        onAddClient(newProjectData);
        toast({ title: "Promovido a Obra Nueva", description: `Se ha creado un nuevo proyecto para ${contactName}.` });
    } else {
        onAddReforma(newProjectData);
        toast({ title: "Promovido a Reforma", description: `Se ha creado una nueva reforma para ${contactName}.` });
    }
    
    setPromotingContact(null);
  };
    
  return (
    <div className="space-y-6">
        <AlertDialog open={!!promotingContact} onOpenChange={(open) => !open && setPromotingContact(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Promover Contacto a Proyecto</AlertDialogTitle>
              <AlertDialogDescription>
                ¿A qué sección quieres añadir a "{promotingContact?.name || 'este contacto'}"? Se creará una nueva entrada con su nombre, email y teléfono.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handlePromoteToProject('reformas')}>Añadir a Reformas</Button>
              <Button onClick={() => handlePromoteToProject('clients')}>Añadir a Obra Nueva</Button>
            </AlertDialogFooter>
             <AlertDialogCancel className="mt-2 w-full">Cancelar</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="main">Contactos Manuales</TabsTrigger>
                <TabsTrigger value="priority">Llamada Prioritaria</TabsTrigger>
                <TabsTrigger value="forms">Formularios Externos</TabsTrigger>
            </TabsList>
            <TabsContent value="main" className="mt-6">
                <DynamicTableCard 
                    title="Contactos Manuales"
                    description="Gestiona tus contactos añadidos manualmente."
                    data={contacts}
                    onAddItem={onAddContact}
                    onUpdateItem={onUpdateContact}
                    onDeleteItem={onDeleteContact}
                    onPromoteItem={setPromotingContact}
                    entityName='Contacto'
                />
            </TabsContent>
            <TabsContent value="priority" className="mt-6">
                <DynamicTableCard 
                    title="Llamadas Prioritarias"
                    description="Contactos marcados para seguimiento inmediato."
                    data={priorityCalls}
                    onAddItem={onAddPriorityCall}
                    onUpdateItem={onUpdatePriorityCall}
                    onDeleteItem={onDeletePriorityCall}
                    onPromoteItem={setPromotingContact}
                    entityName='Llamada Prioritaria'
                />
            </TabsContent>
             <TabsContent value="forms" className="mt-6">
                <MainFormsCard 
                    onAddClient={onAddClient} onAddReforma={onAddReforma}
                    forms={forms} onLoadForms={onLoadForms} onUpdateForm={onUpdateForm} onDeleteForm={onDeleteForm}
                    sheetUrl={sheetUrl} onSaveSheetUrl={onSaveSheetUrl}
                    onAddPriorityCall={onAddPriorityCall}
                />
            </TabsContent>
        </Tabs>
    </div>
  );
}
