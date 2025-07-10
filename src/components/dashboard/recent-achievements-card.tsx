
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
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Pencil, Link, Unlink, UserPlus, Star } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const itemSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  called: z.boolean().default(false),
  status: z.string().default('Pendiente'),
});

type Item = z.infer<typeof itemSchema> & { id: string };

function ItemForm({ item, onSubmit, open, onOpenChange, title }: { item?: Item, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, title: string }) {
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: item || { name: "", phone: "", email: "", called: false, status: 'Pendiente' },
  });

  useEffect(() => {
    if (open) {
      form.reset(item || { name: "", phone: "", email: "", called: false, status: 'Pendiente' });
    }
  }, [item, open, form]);

  const handleSubmit = (values: z.infer<typeof itemSchema>) => {
    onSubmit({ ...item, ...values });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? `Editar ${title}` : `Añadir Nuevo ${title}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre del contacto" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Número de teléfono" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="Email de contacto" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{item ? 'Guardar Cambios' : 'Añadir'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DynamicTableCard({
  title, description, items, onAddItem, onUpdateItem, onDeleteItem, onAddClient, onAddReforma,
  defaultHeaders = ['name', 'phone', 'email']
}: {
  title: string, description: string, items: any[],
  onAddItem: (item: any) => void, onUpdateItem: (item: any) => void, onDeleteItem: (id: string) => void,
  onAddClient: (client: any) => void, onAddReforma: (reforma: any) => void,
  defaultHeaders?: string[]
}) {
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | undefined>(undefined);
  const [promotingItem, setPromotingItem] = useState<any | null>(null);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setAddDialogOpen(true);
  };

  const handlePromote = (section: 'clients' | 'reformas') => {
    if (!promotingItem) return;

    const { id, ...data } = promotingItem;
    const contactName = data.name || 'Nuevo Proyecto desde Contacto';

    const newProjectData = {
        name: contactName, contact: contactName, phone: data.phone, email: data.email, estado: 'Contactado',
        infoAdicional: `Promovido desde ${title}.`, arquitecto: '', providerId: '', memoria: '', planos: '',
    };
    
    if (section === 'clients') {
        onAddClient(newProjectData);
        toast({ title: "Promovido a Obra Nueva", description: `Se ha creado un nuevo proyecto para ${contactName}.` });
    } else {
        onAddReforma(newProjectData);
        toast({ title: "Promovido a Reforma", description: `Se ha creado una nueva reforma para ${contactName}.` });
    }
    
    onDeleteItem(id);
    setPromotingItem(null);
  };
  
  return (
    <Card>
      <AlertDialog open={!!promotingItem} onOpenChange={(open) => !open && setPromotingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿A qué sección quieres añadir a "{promotingItem?.name}"? Se creará una nueva entrada con sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             <Button variant="outline" onClick={() => handlePromote('reformas')}>Añadir a Reformas</Button>
             <Button onClick={() => handlePromote('clients')}>Añadir a Obra Nueva</Button>
          </AlertDialogFooter>
           <AlertDialogCancel className="mt-2 w-full">Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <ItemForm 
        item={editingItem} 
        onSubmit={editingItem ? onUpdateItem : onAddItem} 
        open={isAddDialogOpen} 
        onOpenChange={(open) => { if(!open) setEditingItem(undefined); setAddDialogOpen(open); }}
        title={title}
      />
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Añadir</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
                {defaultHeaders.map(h => <TableHead key={h} className="capitalize">{h.replace(/_/g, ' ')}</TableHead>)}
                <TableHead>Llamado</TableHead><TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {defaultHeaders.map(h => <TableCell key={h} className={h === 'name' ? 'font-medium' : ''}>{item[h]}</TableCell>)}
                  <TableCell><Checkbox checked={item.called} onCheckedChange={(checked) => onUpdateItem({ ...item, called: !!checked })} /></TableCell>
                  <TableCell>
                      <Select value={item.status} onValueChange={(status) => onUpdateItem({ ...item, status })}>
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
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setPromotingItem(item)}><UserPlus className="mr-2"/>Promover a Proyecto</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEdit(item)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                          <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al contacto.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteItem(item.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
               {items.length === 0 && (
                  <TableRow><TableCell colSpan={defaultHeaders.length + 3} className="h-24 text-center">No hay elementos.</TableCell></TableRow>
               )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function GoogleSheetDialog({ open, onOpenChange, currentUrl, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, currentUrl: string, onSave: (url: string) => void }) {
    const [url, setUrl] = useState(currentUrl);

    useEffect(() => {
        setUrl(currentUrl);
    }, [currentUrl, open]);

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

function MainFormsCard({
  onAddClient, onAddReforma, onAddContact, onAddPriorityCall,
  forms, onLoadForms, onUpdateForm, onDeleteForm,
  sheetUrl, onSaveSheetUrl
}: {
  onAddClient: (client: any) => void, onAddReforma: (reforma: any) => void,
  onAddContact: (contact: any) => void, onAddPriorityCall: (call: any) => void,
  forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void,
  sheetUrl: string, onSaveSheetUrl: (url: string) => void
}) {
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [viewingText, setViewingText] = useState<string | null>(null);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  const [promotingForm, setPromotingForm] = useState<any>(null);

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
  
  const handleMoveToPriority = (form: any) => {
    const { id, ...data } = form;
    onAddPriorityCall(data);
    onDeleteForm(id);
    toast({ title: "Movido a Llamada Prioritaria", description: `El contacto ha sido añadido a la lista prioritaria.` });
  };
  
  const handleMoveToContacts = (form: any) => {
    const { id, ...data } = form;
    onAddContact(data);
    onDeleteForm(id);
    toast({ title: "Guardado como Contacto", description: `El contacto ha sido añadido a la lista de contactos manuales.` });
  };

  const handlePromote = (section: 'clients' | 'reformas') => {
    if (!promotingForm) return;

    const { id, ...data } = promotingForm;
    const contactName = data.name || data.Nombre || data.nombre || 'Nuevo Proyecto';

    const newProjectData = {
        name: contactName,
        contact: contactName,
        phone: data.phone || data.Phone || data.Teléfono || '',
        email: data.email || data.Email || '',
        estado: 'Contactado',
        infoAdicional: 'Promovido desde formulario web.',
        arquitecto: '',
        providerId: '',
        memoria: '',
        planos: '',
    };
    
    if (section === 'clients') {
        onAddClient(newProjectData);
        toast({ title: "Promovido a Obra Nueva", description: `Se ha creado una nueva Obra Nueva para ${contactName}.` });
    } else {
        onAddReforma(newProjectData);
        toast({ title: "Promovido a Reforma", description: `Se ha creado una nueva reforma para ${contactName}.` });
    }
    
    onDeleteForm(id);
    setPromotingForm(null);
  };

  return (
    <Card>
      <AlertDialog open={!!promotingForm} onOpenChange={(open) => !open && setPromotingForm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover Contacto a Proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿A qué sección quieres añadir a "{promotingForm?.name || 'este contacto'}"? Se creará una nueva entrada con su nombre, email y teléfono.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handlePromote('reformas')}>Añadir a Reformas</Button>
            <Button onClick={() => handlePromote('clients')}>Añadir a Obra Nueva</Button>
          </AlertDialogFooter>
          <AlertDialogCancel className="mt-2 w-full">Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

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
        <CardTitle>Formularios Externos y Contactos</CardTitle>
        <CardDescription>Gestiona las respuestas de tus formularios y añade contactos manualmente.</CardDescription>
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
                                      <DropdownMenuItem onSelect={() => handleMoveToPriority(sub)}><Star className="mr-2"/>Mover a Prioritarios</DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => handleMoveToContacts(sub)}><UserPlus className="mr-2"/>Guardar como Contacto</DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => setPromotingForm(sub)}><UserPlus className="mr-2"/>Promover a Obra Nueva</DropdownMenuItem>
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
  return (
    <Tabs defaultValue="main" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Formularios y Contactos</TabsTrigger>
          <TabsTrigger value="priority">Llamada Prioritaria</TabsTrigger>
      </TabsList>
      <TabsContent value="main" className="mt-6">
        <div className="space-y-6">
            <MainFormsCard 
                onAddClient={onAddClient} onAddReforma={onAddReforma} onAddContact={onAddContact} onAddPriorityCall={onAddPriorityCall}
                forms={forms} onLoadForms={onLoadForms} onUpdateForm={onUpdateForm} onDeleteForm={onDeleteForm}
                sheetUrl={sheetUrl} onSaveSheetUrl={onSaveSheetUrl}
            />
             <DynamicTableCard
                title="Contactos Manuales"
                description="Añade y gestiona contactos que no provienen de formularios."
                items={contacts}
                onAddItem={onAddContact}
                onUpdateItem={onUpdateContact}
                onDeleteItem={onDeleteContact}
                onAddClient={onAddClient}
                onAddReforma={onAddReforma}
            />
        </div>
      </TabsContent>
      <TabsContent value="priority" className="mt-6">
          <DynamicTableCard
              title="Llamada Prioritaria"
              description="Contactos marcados como prioritarios desde la bandeja de entrada de formularios."
              items={priorityCalls}
              onAddItem={onAddPriorityCall}
              onUpdateItem={onUpdatePriorityCall}
              onDeleteItem={onDeletePriorityCall}
              onAddClient={onAddClient}
              onAddReforma={onAddReforma}
          />
      </TabsContent>
    </Tabs>
  );
}
