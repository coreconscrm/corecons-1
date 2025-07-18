
"use client"

import { useRef, useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Link, Unlink, UserPlus, Star, Pencil, Settings, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const itemSchema = z.record(z.any());

type Item = { [key: string]: any; id: string };

type ColumnConfig = {
    key: string;
    visible: boolean;
    displayName: string;
};

const columnDisplayNames: Record<string, string> = {
    'Columna 12': 'Info de llamada',
    'Columna 12 1': 'Fecha Llamada',
    'called': 'Llamado',
    'status': 'Estado',
};

function getDisplayName(key: string) {
    return columnDisplayNames[key] || key.replace(/_/g, ' ');
}


function ColumnSettingsDialog({ 
    columns, 
    onSave, 
    open, 
    onOpenChange 
}: { 
    columns: ColumnConfig[], 
    onSave: (cols: ColumnConfig[]) => void, 
    open: boolean, 
    onOpenChange: (o: boolean) => void 
}) {
    const [currentColumns, setCurrentColumns] = useState(columns);

    useEffect(() => {
        setCurrentColumns(columns);
    }, [columns, open]);

    const handleToggleVisibility = (key: string) => {
        setCurrentColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };
    
    const handleDisplayNameChange = (key: string, newName: string) => {
        setCurrentColumns(prev => prev.map(c => c.key === key ? { ...c, displayName: newName } : c));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newColumns = [...currentColumns];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newColumns.length) {
            [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
            setCurrentColumns(newColumns);
        }
    };

    const handleSave = () => {
        onSave(currentColumns);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Configurar Columnas</DialogTitle>
                    <DialogDescription>
                        Renombra, reordena y cambia la visibilidad de las columnas.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentColumns.map((col, index) => (
                        <div key={col.key} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                            <Checkbox
                                id={`vis-${col.key}`}
                                checked={col.visible}
                                onCheckedChange={() => handleToggleVisibility(col.key)}
                            />
                            <Input 
                                value={col.displayName}
                                onChange={(e) => handleDisplayNameChange(col.key, e.target.value)}
                                className="h-8 flex-1"
                            />
                            <div className="flex">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, 'down')} disabled={index === currentColumns.length - 1}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function ItemForm({ item, onSubmit, open, onOpenChange, title, headers }: { item?: Item, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, title: string, headers: string[] }) {
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: item || {},
  });

  useEffect(() => {
    if (open) {
      const defaultValues: { [key: string]: any } = {};
      headers.forEach(header => {
        defaultValues[header] = item?.[header] || '';
      });
      defaultValues.called = item?.called || false;
      defaultValues.status = item?.status || 'Pendiente';
      form.reset(item ? { ...defaultValues, ...item } : defaultValues);
    }
  }, [item, open, form, headers]);

  const handleSubmit = (values: z.infer<typeof itemSchema>) => {
    onSubmit({ ...item, ...values });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? `Editar ${title}` : `Añadir Nuevo ${title}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {headers.map(header => (
              <FormField
                key={header}
                control={form.control}
                name={header}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{getDisplayName(header)}</FormLabel>
                    <FormControl>
                      <Input placeholder={`Introduce ${getDisplayName(header)}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
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
  title, description, items,
  columnConfig, onColumnConfigChange,
  onAddItem, onUpdateItem, onDeleteItem,
  itemActions,
  children
}: {
  title: string, description: string, items: any[],
  columnConfig: ColumnConfig[], onColumnConfigChange: (cols: ColumnConfig[]) => void,
  onAddItem: (item: any) => void, onUpdateItem: (item: any) => void, onDeleteItem: (id: string) => void,
  itemActions: (item: any) => React.ReactNode,
  children?: React.ReactNode
}) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | undefined>(undefined);
  const [viewingText, setViewingText] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const allHeaders = useMemo(() => columnConfig.map(c => c.key), [columnConfig]);
  const visibleHeaders = useMemo(() => columnConfig.filter(c => c.visible), [columnConfig]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setAddDialogOpen(true);
  };
  
  const handleSubmit = (values: any) => {
    if(editingItem) {
      onUpdateItem(values);
    } else {
      onAddItem(values);
    }
  }

  return (
    <Card>
      <ColumnSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} columns={columnConfig} onSave={onColumnConfigChange} />
      <Dialog open={!!viewingText} onOpenChange={() => setViewingText(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Texto Completo</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] my-4"><div className="whitespace-pre-wrap break-words pr-4">{viewingText}</div></ScrollArea>
          <DialogFooter><Button variant="outline" onClick={() => setViewingText(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
     
      <ItemForm 
        item={editingItem} 
        onSubmit={handleSubmit} 
        open={isAddDialogOpen} 
        onOpenChange={(open) => { if(!open) setEditingItem(undefined); setAddDialogOpen(open); }}
        title={title}
        headers={allHeaders.filter(h => h !== 'called' && h !== 'status')}
      />
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {children}
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4"/>
              <span className="sr-only">Configurar columnas</span>
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Añadir</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="rounded-md border">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader><TableRow>
                    <TableHead>Acciones</TableHead>
                    {visibleHeaders.map(h => <TableHead key={h.key} className="capitalize">{h.displayName}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                       <TableCell>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {itemActions(item)}
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
                      {visibleHeaders.map(h => {
                        const cellKey = `${item.id}-${h.key}`;
                        if (h.key === 'called') {
                            return <TableCell key={cellKey}><Checkbox checked={item.called} onCheckedChange={(checked) => onUpdateItem({ ...item, called: !!checked })} /></TableCell>
                        }
                        if (h.key === 'status') {
                            return <TableCell key={cellKey}>
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
                        }
                        
                        const textValue = item[h.key]?.toString() || '';
                        const isLongText = textValue.length > 50;
                        return (
                            <TableCell key={cellKey} className="max-w-[200px]">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay elementos</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Añade un elemento o carga datos desde un CSV/Google Sheet.
                </p>
            </div>
        )}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const { toast } = useToast();
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);

  const allItems = useMemo(() => [...forms, ...contacts, ...priorityCalls], [forms, contacts, priorityCalls]);

  const [columnConfigs, setColumnConfigs] = useState<{ [key: string]: ColumnConfig[] }>({
      forms: [],
      contacts: [],
      priority: [],
  });

  const getHeadersFromItems = (items: Item[]) => {
      const headerSet = new Set<string>();
      items.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'id') {
            headerSet.add(key);
          }
        });
      });
      return Array.from(headerSet);
  };
  
  useEffect(() => {
    const loadConfigs = () => {
        if (typeof window === 'undefined') return;

        const getInitialConfig = (storageKey: string, currentHeaders: string[]) => {
            try {
                const savedConfig = localStorage.getItem(storageKey);
                if (savedConfig) {
                    const parsedConfig: ColumnConfig[] = JSON.parse(savedConfig);
                    const parsedHeaderKeys = new Set(parsedConfig.map(c => c.key));
                    const finalConfig = [...parsedConfig];
                    
                    currentHeaders.forEach(key => {
                        if (!parsedHeaderKeys.has(key)) {
                            finalConfig.push({ key, visible: true, displayName: getDisplayName(key) });
                        }
                    });
                    
                    const currentHeaderSet = new Set(currentHeaders);
                    return finalConfig.filter(c => currentHeaderSet.has(c.key));
                }
            } catch (e) {
                console.error(`Failed to parse column config from localStorage for ${storageKey}`, e);
            }
            return currentHeaders.map(h => ({ key: h, visible: true, displayName: getDisplayName(h) }));
        };
        
        const allContactHeaders = getHeadersFromItems(contacts);
        if (!allContactHeaders.includes('called')) allContactHeaders.push('called');
        if (!allContactHeaders.includes('status')) allContactHeaders.push('status');

        const allPriorityHeaders = getHeadersFromItems(priorityCalls);
        if (!allPriorityHeaders.includes('called')) allPriorityHeaders.push('called');
        if (!allPriorityHeaders.includes('status')) allPriorityHeaders.push('status');

        setColumnConfigs({
            forms: getInitialConfig('formsColumnsConfig', getHeadersFromItems(forms)),
            contacts: getInitialConfig('contactsColumnsConfig', allContactHeaders),
            priority: getInitialConfig('priorityColumnsConfig', allPriorityHeaders),
        });
    };

    loadConfigs();
  }, [allItems, forms, contacts, priorityCalls]);

  const handleColumnChange = (type: 'forms' | 'contacts' | 'priority', newConfig: ColumnConfig[]) => {
      setColumnConfigs(prev => ({ ...prev, [type]: newConfig }));
      if (typeof window !== 'undefined') {
          localStorage.setItem(`${type}ColumnsConfig`, JSON.stringify(newConfig));
      }
  };
  
  const [promotingItem, setPromotingItem] = useState<any | null>(null);

  const handlePromote = (section: 'clients' | 'reformas') => {
    if (!promotingItem) return;

    const { id, ...data } = promotingItem;
    const contactName = data.name || data.Nombre || data.nombre || 'Nuevo Proyecto desde Contacto';

    const newProjectData = {
        name: contactName,
        contact: contactName,
        phone: data.phone || data.Teléfono || data.telefono || '',
        email: data.email || data.Email || data.email_address || data['Dirección de correo electrónico'] || '',
        estado: 'Contactado',
        infoAdicional: `Promovido desde un contacto.\n\nDatos originales:\n${Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n')}`,
        arquitecto: '', providerId: '', memoria: '', planos: '',
    };
    
    if (section === 'clients') {
        onAddClient(newProjectData);
        toast({ title: "Promovido a Obra Nueva", description: `Se ha creado un nuevo proyecto para ${contactName}.` });
    } else {
        onAddReforma(newProjectData);
        toast({ title: "Promovido a Reforma", description: `Se ha creado una nueva reforma para ${contactName}.` });
    }
    
    if (contacts.some(c => c.id === id)) onDeleteContact(id);
    if (priorityCalls.some(p => p.id === id)) onDeletePriorityCall(id);
    
    setPromotingItem(null);
  };
  
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

  const mapAndTransferData = (form: any, destination: 'contacts' | 'priority') => {
      const { id, ...originalData } = form;
      const dataToMove = { ...originalData, called: form.called || false, status: form.status || 'Pendiente' };
      if (destination === 'contacts') {
          onAddContact(dataToMove);
          toast({ title: "Guardado como Contacto", description: `El contacto ha sido añadido a la lista de contactos manuales.` });
      } else {
          onAddPriorityCall(dataToMove);
          toast({ title: "Movido a Llamada Prioritaria", description: `El contacto ha sido añadido a la lista prioritaria.` });
      }
      onDeleteForm(form.id);
  };

  return (
    <Tabs defaultValue="main" className="w-full">
       <AlertDialog open={!!promotingItem} onOpenChange={(open) => !open && setPromotingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿A qué sección quieres añadir a "{promotingItem?.name || promotingItem?.Nombre || promotingItem?.nombre}"? Se creará una nueva entrada con sus datos de contacto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             <Button variant="outline" onClick={() => handlePromote('reformas')}>Añadir a Reformas</Button>
             <Button onClick={() => handlePromote('clients')}>Añadir a Obra Nueva</Button>
          </AlertDialogFooter>
           <AlertDialogCancel className="mt-2 w-full">Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <GoogleSheetDialog 
        open={isSheetDialogOpen}
        onOpenChange={setIsSheetDialogOpen}
        currentUrl={sheetUrl}
        onSave={onSaveSheetUrl}
      />

      <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Formularios y Contactos</TabsTrigger>
          <TabsTrigger value="priority">Llamada Prioritaria</TabsTrigger>
      </TabsList>
      <TabsContent value="main" className="mt-6">
        <div className="space-y-6">
            <DynamicTableCard
                title="Contactos Manuales"
                description="Añade y gestiona contactos que no provienen de formularios."
                items={contacts}
                columnConfig={columnConfigs.contacts}
                onColumnConfigChange={(newConfig) => handleColumnChange('contacts', newConfig)}
                onAddItem={onAddContact}
                onUpdateItem={onUpdateContact}
                onDeleteItem={onDeleteContact}
                itemActions={(item) => (
                    <DropdownMenuItem onSelect={() => setPromotingItem(item)}><UserPlus className="mr-2"/>Promover a Proyecto</DropdownMenuItem>
                )}
            />
            <DynamicTableCard
                title="Formularios Externos"
                description="Gestiona las respuestas de tus formularios y añade contactos manualmente."
                items={forms}
                columnConfig={columnConfigs.forms}
                onColumnConfigChange={(newConfig) => handleColumnChange('forms', newConfig)}
                onAddItem={() => toast({ variant: 'destructive', title: 'Acción no permitida', description: 'Usa "Cargar CSV" o añade contactos manuales.'})}
                onUpdateItem={onUpdateForm}
                onDeleteItem={onDeleteForm}
                itemActions={(item) => (
                    <>
                        <DropdownMenuItem onSelect={() => mapAndTransferData(item, 'priority')}><Star className="mr-2"/>Mover a Prioritarios</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => mapAndTransferData(item, 'contacts')}><UserPlus className="mr-2"/>Guardar como Contacto</DropdownMenuItem>
                    </>
                )}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden"/>
                <Button onClick={triggerFileUpload}><Upload className="mr-2 h-4 w-4"/>Cargar CSV</Button>
                <Button variant="outline" onClick={() => setIsSheetDialogOpen(true)}><Link className="mr-2 h-4 w-4"/>{sheetUrl ? "Cambiar Sheet" : "Conectar Sheet"}</Button>
                <Button variant="outline" asChild><a href={formUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir Formulario</a></Button>
            </DynamicTableCard>
        </div>
      </TabsContent>
      <TabsContent value="priority" className="mt-6">
          <DynamicTableCard
              title="Llamada Prioritaria"
              description="Contactos marcados como prioritarios desde la bandeja de entrada de formularios."
              items={priorityCalls}
              columnConfig={columnConfigs.priority}
              onColumnConfigChange={(newConfig) => handleColumnChange('priority', newConfig)}
              onAddItem={onAddPriorityCall}
              onUpdateItem={onUpdatePriorityCall}
              onDeleteItem={onDeletePriorityCall}
              itemActions={(item) => (
                 <DropdownMenuItem onSelect={() => setPromotingItem(item)}><UserPlus className="mr-2"/>Promover a Proyecto</DropdownMenuItem>
              )}
          />
      </TabsContent>
    </Tabs>
  );
}


    
