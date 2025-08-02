
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
import { Trash2, Upload, ExternalLink, FileText, Plus, MoreHorizontal, Link, Unlink, UserPlus, Star, Pencil, Settings, ArrowUp, ArrowDown, BrainCircuit, Forward } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { SeguimientoListCard, type Seguimiento } from '../seguimiento-card';


const itemSchema = z.record(z.any());

type Item = { [key: string]: any; id: string };

export type ColumnConfig = {
    key: string;
    visible: boolean;
    displayName: string;
};

const columnDisplayNames: Record<string, string> = {
    'Columna 12': 'Info de llamada',
    'Columna 12 1': 'Fecha Llamada',
    'called': 'Llamado',
    'status': 'Estado',
    'createdAt': 'Fecha de Creación',
};

export function getDisplayName(key: string) {
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
                      <Input placeholder={`Introduce ${getDisplayName(header)}`} {...field} value={field.value ?? ''}/>
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
        headers={allHeaders.filter(h => h !== 'called' && h !== 'status' && h !== 'createdAt')}
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
                        if (h.key === 'createdAt' && item.createdAt?.toDate) {
                            return <TableCell key={cellKey}>{item.createdAt.toDate().toLocaleDateString('es-ES')} {item.createdAt.toDate().toLocaleTimeString('es-ES')}</TableCell>
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
  forms,
  onDeleteForm,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  priorityCalls,
  onAddPriorityCall,
  onUpdatePriorityCall,
  onDeletePriorityCall,
  sheetUrl,
  onSaveSheetUrl,
  formCols,
  onFormColsChange,
  contactCols,
  onContactColsChange,
  priorityCols,
  onPriorityColsChange,
  onCreateSeguimientoFromContact,
  onLoadForms,
}: {
  forms: Item[],
  onDeleteForm: (id: string) => void,
  contacts: Item[],
  onAddContact: (item: any) => void,
  onUpdateContact: (item: any) => void,
  onDeleteContact: (id: string) => void,
  priorityCalls: Item[],
  onAddPriorityCall: (item: any) => void,
  onUpdatePriorityCall: (item: any) => void,
  onDeletePriorityCall: (id: string) => void,
  sheetUrl: string,
  onSaveSheetUrl: (url: string) => void,
  formCols: ColumnConfig[],
  onFormColsChange: (cols: ColumnConfig[]) => void,
  contactCols: ColumnConfig[],
  onContactColsChange: (cols: ColumnConfig[]) => void,
  priorityCols: ColumnConfig[],
  onPriorityColsChange: (cols: ColumnConfig[]) => void,
  onCreateSeguimientoFromContact: (contact: Item, from: 'contacts' | 'priority_calls') => void,
  onLoadForms: (data: any[]) => void,
}) {
    const [isSheetDialogOpen, setSheetDialogOpen] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("forms");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    onLoadForms(results.data);
                },
                error: (err) => {
                    toast({ variant: "destructive", title: "Error al leer CSV", description: (err as Error).message });
                },
            });
        }
    };
    
    useEffect(() => {
        const savedTab = localStorage.getItem('formsSection_activeTab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('formsSection_activeTab', value);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <GoogleSheetDialog open={isSheetDialogOpen} onOpenChange={setSheetDialogOpen} currentUrl={sheetUrl} onSave={onSaveSheetUrl} />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="forms">Formularios Web</TabsTrigger>
                <TabsTrigger value="contacts">Contactos Manuales</TabsTrigger>
                <TabsTrigger value="priority">Llamada Prioritaria</TabsTrigger>
            </TabsList>
            <TabsContent value="forms" className="mt-6">
                <DynamicTableCard
                    title="Formularios Web"
                    description="Datos cargados desde CSV o Google Sheets."
                    items={forms}
                    columnConfig={formCols}
                    onColumnConfigChange={onFormColsChange}
                    onAddItem={() => {}} // No se pueden añadir manualmente
                    onUpdateItem={() => {}} // No se pueden editar
                    onDeleteItem={onDeleteForm}
                    itemActions={() => <></>}
                >
                     <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Subir CSV</Button>
                     <Button variant="outline" onClick={() => setSheetDialogOpen(true)}><Link className="mr-2 h-4 w-4" />Conectar Sheet</Button>
                </DynamicTableCard>
            </TabsContent>
            <TabsContent value="contacts" className="mt-6">
                <DynamicTableCard
                    title="Contactos Manuales"
                    description="Contactos añadidos manualmente que requieren seguimiento."
                    items={contacts}
                    columnConfig={contactCols}
                    onColumnConfigChange={onContactColsChange}
                    onAddItem={onAddContact}
                    onUpdateItem={onUpdateContact}
                    onDeleteItem={onDeleteContact}
                    itemActions={(item) => (
                        <DropdownMenuItem onSelect={() => onCreateSeguimientoFromContact(item, 'contacts')}>
                            <Forward className="mr-2 h-4 w-4" /> Mover a Seguimiento
                        </DropdownMenuItem>
                    )}
                />
            </TabsContent>
            <TabsContent value="priority" className="mt-6">
                 <DynamicTableCard
                    title="Llamada Prioritaria"
                    description="Contactos importantes que necesitan una llamada urgente."
                    items={priorityCalls}
                    columnConfig={priorityCols}
                    onColumnConfigChange={onPriorityColsChange}
                    onAddItem={onAddPriorityCall}
                    onUpdateItem={onUpdatePriorityCall}
                    onDeleteItem={onDeletePriorityCall}
                    itemActions={(item) => (
                        <DropdownMenuItem onSelect={() => onCreateSeguimientoFromContact(item, 'priority_calls')}>
                            <Forward className="mr-2 h-4 w-4" /> Mover a Seguimiento
                        </DropdownMenuItem>
                    )}
                />
            </TabsContent>
        </Tabs>
    );
}
