

"use client"

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, MoreHorizontal, Pencil, Trash2, CalendarIcon, Info, Settings, Plus, SquarePen, FolderOpen, Move, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SeguimientoPrintLayout } from "./seguimiento-print-layout";
import { Checkbox } from "../ui/checkbox";

const seguimientoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  localizacion: z.string().optional(),
  informacion: z.string().optional(),
  estado: z.string().optional(),
  porHacer: z.string().optional(),
  siguienteLlamada: z.date().optional().nullable(),
  category: z.string().optional(),
});

export type SeguimientoCategory = { name: string; visible: boolean };
export type Seguimiento = { 
    id: string, 
    name?: string,
    phone?: string,
    email?: string,
    localizacion?: string,
    informacion?: string,
    estado?: string,
    porHacer?: string,
    siguienteLlamada: string | null,
    category?: string,
};

function OptionsSettingsDialog({ 
    estadoOptions, 
    porHacerOptions,
    categories,
    onSave, 
    open, 
    onOpenChange 
}: { 
    estadoOptions: string[], 
    porHacerOptions: string[],
    categories: SeguimientoCategory[],
    onSave: (type: 'estado' | 'porHacer' | 'categories', options: any[]) => void, 
    open: boolean, 
    onOpenChange: (o: boolean) => void 
}) {
    const [currentEstado, setCurrentEstado] = useState(estadoOptions);
    const [currentPorHacer, setCurrentPorHacer] = useState(porHacerOptions);
    const [currentCategories, setCurrentCategories] = useState(categories);
    const [newEstado, setNewEstado] = useState("");
    const [newPorHacer, setNewPorHacer] = useState("");
    const [newCategory, setNewCategory] = useState("");

    useEffect(() => {
        if (open) {
            setCurrentEstado(estadoOptions);
            setCurrentPorHacer(porHacerOptions);
            setCurrentCategories(categories);
        }
    }, [estadoOptions, porHacerOptions, categories, open]);
    
    const handleSave = () => {
        onSave('estado', currentEstado);
        onSave('porHacer', currentPorHacer);
        onSave('categories', currentCategories);
        onOpenChange(false);
    };
    
    const handleAddOption = (type: 'estado' | 'porHacer' | 'categories') => {
        if (type === 'estado' && newEstado.trim()) {
            setCurrentEstado([...currentEstado, newEstado.trim()]);
            setNewEstado("");
        } else if (type === 'porHacer' && newPorHacer.trim()) {
            setCurrentPorHacer([...currentPorHacer, newPorHacer.trim()]);
            setNewPorHacer("");
        } else if (type === 'categories' && newCategory.trim()) {
            if (!currentCategories.some(c => c.name === newCategory.trim())) {
                setCurrentCategories([...currentCategories, { name: newCategory.trim(), visible: true }]);
                setNewCategory("");
            }
        }
    };

    const handleEditOption = (type: 'estado' | 'porHacer' | 'categories', index: number, value: any) => {
        if (type === 'estado') {
            const updated = [...currentEstado];
            updated[index] = value;
            setCurrentEstado(updated);
        } else if (type === 'porHacer') {
            const updated = [...currentPorHacer];
            updated[index] = value;
            setCurrentPorHacer(updated);
        } else if (type === 'categories') {
            const updated = [...currentCategories];
            updated[index] = value;
            setCurrentCategories(updated);
        }
    };
    
    const handleDeleteOption = (type: 'estado' | 'porHacer' | 'categories', index: number) => {
        if (type === 'estado') {
            setCurrentEstado(currentEstado.filter((_, i) => i !== index));
        } else if (type === 'porHacer') {
            setCurrentPorHacer(currentPorHacer.filter((_, i) => i !== index));
        } else if (type === 'categories') {
            setCurrentCategories(currentCategories.filter((_, i) => i !== index));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Configurar Opciones de Seguimiento</DialogTitle>
                    <DialogDescription>Añade, edita o elimina las opciones de los desplegables y gestiona las subsecciones.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    {/* Estado */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Opciones de Estado</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {currentEstado.map((option, index) => (
                               <div key={index} className="flex items-center gap-2">
                                   <Input value={option} onChange={(e) => handleEditOption('estado', index, e.target.value)} />
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteOption('estado', index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                               </div>
                           ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Nueva opción de estado" value={newEstado} onChange={(e) => setNewEstado(e.target.value)} />
                            <Button size="icon" onClick={() => handleAddOption('estado')}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    {/* Por Hacer */}
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Opciones de "Por Hacer"</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {currentPorHacer.map((option, index) => (
                               <div key={index} className="flex items-center gap-2">
                                   <Input value={option} onChange={(e) => handleEditOption('porHacer', index, e.target.value)} />
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteOption('porHacer', index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                               </div>
                           ))}
                        </div>
                        <div className="flex items-center gap-2">
                           <Input placeholder="Nueva acción" value={newPorHacer} onChange={(e) => setNewPorHacer(e.target.value)} />
                           <Button size="icon" onClick={() => handleAddOption('porHacer')}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    {/* Categories */}
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Subsecciones</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {currentCategories.map((cat, index) => (
                               <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                                   <Switch id={`vis-${cat.name}`} checked={cat.visible} onCheckedChange={(checked) => handleEditOption('categories', index, {...cat, visible: checked})} />
                                   <Input className="flex-1 h-8" value={cat.name} onChange={(e) => handleEditOption('categories', index, {...cat, name: e.target.value})} disabled={cat.name === 'General'}/>
                                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteOption('categories', index)} disabled={cat.name === 'General'}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                               </div>
                           ))}
                        </div>
                        <div className="flex items-center gap-2">
                           <Input placeholder="Nueva subsección" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                           <Button size="icon" onClick={() => handleAddOption('categories')}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function SeguimientoForm({ seguimiento, onSubmit, open, onOpenChange, estadoOptions, porHacerOptions, categories }: { seguimiento?: Seguimiento, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, estadoOptions: string[], porHacerOptions: string[], categories: SeguimientoCategory[] }) {
    const form = useForm<z.infer<typeof seguimientoSchema>>({
        resolver: zodResolver(seguimientoSchema),
    });

    useEffect(() => {
        if (open) {
            let defaultValues;
            if (seguimiento) {
                 const callDate = seguimiento.siguienteLlamada 
                    ? parse(seguimiento.siguienteLlamada, 'dd/MM/yyyy', new Date())
                    : null;
                defaultValues = {
                    name: seguimiento.name || "",
                    phone: seguimiento.phone || "",
                    email: seguimiento.email || "",
                    localizacion: seguimiento.localizacion || "",
                    informacion: seguimiento.informacion || "",
                    estado: seguimiento.estado || "",
                    porHacer: seguimiento.porHacer || "",
                    siguienteLlamada: callDate && isValid(callDate) ? callDate : null,
                    category: seguimiento.category || "General",
                };
            } else {
                defaultValues = { name: "", phone: "", email: "", localizacion: "", informacion: "", estado: "", porHacer: "", siguienteLlamada: null, category: "General" };
            }
            form.reset(defaultValues);
        }
    }, [seguimiento, open, form]);
    
    const handleSubmit = async (values: z.infer<typeof seguimientoSchema>) => {
        const submissionData = {
            ...seguimiento,
            ...values,
            siguienteLlamada: values.siguienteLlamada ? format(values.siguienteLlamada, "dd/MM/yyyy") : null,
        };
        onSubmit(submissionData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{seguimiento ? "Editar Seguimiento" : "Añadir Nuevo Seguimiento"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="juan.p@email.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="localizacion" render={({ field }) => (
                            <FormItem><FormLabel>Localización</FormLabel><FormControl><Input placeholder="Ciudad, Provincia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="informacion" render={({ field }) => (
                            <FormItem><FormLabel>Información</FormLabel><FormControl><Textarea placeholder="Detalles del contacto, interés, etc." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="estado" render={({ field }) => (
                                <FormItem><FormLabel>Estado</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {estadoOptions.map(option => <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="porHacer" render={({ field }) => (
                                <FormItem><FormLabel>Por Hacer</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una acción" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {porHacerOptions.map(option => <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="siguienteLlamada" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Siguiente Llamada</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Selecciona una fecha</span>)}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus weekStartsOn={1} locale={es} />
                                        </PopoverContent>
                                    </Popover><FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>Subsección</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? 'General'}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una subsección" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {categories.map(option => <SelectItem key={option.name} value={option.name}>{option.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{seguimiento ? "Guardar Cambios" : "Guardar Seguimiento"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function SeguimientoListCard({ 
    seguimientos, 
    onAddSeguimiento, 
    onUpdateSeguimiento, 
    onDeleteSeguimiento,
    estadoOptions,
    porHacerOptions,
    categories,
    onSeguimientoOptionsChange
}: { 
    seguimientos: Seguimiento[], 
    onAddSeguimiento: (s: any) => void, 
    onUpdateSeguimiento: (s: any) => void, 
    onDeleteSeguimiento: (id: string) => void,
    estadoOptions: string[],
    porHacerOptions: string[],
    categories: SeguimientoCategory[],
    onSeguimientoOptionsChange: (type: 'estado' | 'porHacer' | 'categories', options: any[]) => void,
}) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeSeguimiento, setActiveSeguimiento] = useState<Seguimiento | undefined>(undefined);
    const [viewingInfo, setViewingInfo] = useState<string | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [printingData, setPrintingData] = useState<{ title: string; seguimientos: Seguimiento[] } | null>(null);
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (printingData) {
            const timer = setTimeout(() => {
                window.print();
                setPrintingData(null);
            }, 250); // Delay to allow state to update and component to render
            return () => clearTimeout(timer);
        }
    }, [printingData]);

    const groupedSeguimientos = useMemo(() => {
        const visibleCategories = categories.filter(c => c.visible).map(c => c.name);
        const groups: Record<string, Seguimiento[]> = {};
        
        visibleCategories.forEach(catName => {
            groups[catName] = [];
        });

        seguimientos.forEach(s => {
            const category = s.category || 'General';
            if (groups[category] !== undefined) { // Only include suivis from visible categories
                groups[category].push(s);
            }
        });

        // Sort items within each group
        for (const category in groups) {
            groups[category].sort((a, b) => {
                const dateA = a.siguienteLlamada ? parse(a.siguienteLlamada, 'dd/MM/yyyy', new Date()) : null;
                const dateB = b.siguienteLlamada ? parse(b.siguienteLlamada, 'dd/MM/yyyy', new Date()) : null;

                if (dateA && isValid(dateA) && dateB && isValid(dateB)) {
                    return dateA.getTime() - dateB.getTime();
                }
                if (dateA && isValid(dateA)) return -1; // a has date, b doesn't, a comes first
                if (dateB && isValid(dateB)) return 1;  // b has date, a doesn't, b comes first
                return 0; // both have no date
            });
        }
        
        return groups;
    }, [seguimientos, categories]);

    const handleEdit = (seguimiento: Seguimiento) => {
        setActiveSeguimiento(seguimiento);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveSeguimiento(undefined);
        setFormOpen(true);
    }

    const handleSubmit = (values: any) => {
        if (activeSeguimiento) {
            onUpdateSeguimiento(values);
        } else {
            onAddSeguimiento(values);
        }
    };
    
    const formatDisplayDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        const date = parse(dateString, 'dd/MM/yyyy', new Date());
        return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Fecha inválida';
    };

    const handlePrint = (category?: string) => {
        if (category) {
            setPrintingData({
                title: `Informe de Seguimiento - ${category}`,
                seguimientos: groupedSeguimientos[category] || [],
            });
        } else {
             setPrintingData({
                title: 'Informe de Seguimiento - Completo',
                seguimientos: seguimientos,
            });
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelectedRows = { ...selectedRows };
        if (checked) {
            newSelectedRows[id] = true;
        } else {
            delete newSelectedRows[id];
        }
        setSelectedRows(newSelectedRows);
    };

    const handleSelectAllInCategory = (category: string, checked: boolean) => {
        const newSelectedRows = { ...selectedRows };
        const categoryItems = groupedSeguimientos[category] || [];
        categoryItems.forEach(item => {
            if (checked) {
                newSelectedRows[item.id] = true;
            } else {
                delete newSelectedRows[item.id];
            }
        });
        setSelectedRows(newSelectedRows);
    };
    
    const selectedIds = useMemo(() => Object.keys(selectedRows).filter(id => selectedRows[id]), [selectedRows]);
    
    const handlePrintSelected = () => {
        const selectedItems = seguimientos.filter(s => selectedIds.includes(s.id));
        setPrintingData({
            title: 'Informe de Seguimiento - Selección',
            seguimientos: selectedItems,
        });
        setSelectedRows({}); // Clear selection after printing
    };

    return (
        <Card>
             <div className="printable-area">
                <SeguimientoPrintLayout 
                    title={printingData?.title || ""}
                    seguimientos={printingData?.seguimientos || []}
                />
            </div>
            <Dialog open={!!viewingInfo} onOpenChange={() => setViewingInfo(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Información Adicional</DialogTitle></DialogHeader>
                    <div className="py-4 whitespace-pre-wrap">{viewingInfo}</div>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>

            <OptionsSettingsDialog
                open={isOptionsOpen}
                onOpenChange={setIsOptionsOpen}
                estadoOptions={estadoOptions}
                porHacerOptions={porHacerOptions}
                categories={categories}
                onSave={onSeguimientoOptionsChange}
            />

            <SeguimientoForm 
              seguimiento={activeSeguimiento} 
              onSubmit={handleSubmit} 
              open={isFormOpen} 
              onOpenChange={(isOpen) => {
                  if(!isOpen) setActiveSeguimiento(undefined);
                  setFormOpen(isOpen);
              }}
              estadoOptions={estadoOptions}
              porHacerOptions={porHacerOptions}
              categories={categories}
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Seguimiento de Clientes</CardTitle>
                    <CardDescription>Gestiona nuevos contactos y su proceso inicial.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button variant="destructive" onClick={handlePrintSelected}>
                            <Printer className="mr-2 h-4 w-4" />Imprimir Selección ({selectedIds.length})
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handlePrint()}>Imprimir Todo</DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Imprimir Subsección</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {Object.keys(groupedSeguimientos).map(cat => (
                                        <DropdownMenuItem key={cat} onSelect={() => handlePrint(cat)}>{cat}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={() => setIsOptionsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                    </Button>
                    <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Seguimiento</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-4">
                    {Object.entries(groupedSeguimientos).map(([category, seguimientosInCategory]) => {
                        const allInCategorySelected = seguimientosInCategory.length > 0 && seguimientosInCategory.every(s => selectedRows[s.id]);
                        return (
                        <AccordionItem value={category} key={category} className="border rounded-md">
                            <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                 <div className="flex items-center gap-2 font-semibold text-lg">
                                    <FolderOpen className="h-5 w-5" />
                                    {category} ({seguimientosInCategory.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full overflow-x-auto border-t">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={allInCategorySelected}
                                                        onCheckedChange={(checked) => handleSelectAllInCategory(category, !!checked)}
                                                        aria-label={`Seleccionar todo en ${category}`}
                                                    />
                                                </TableHead>
                                                <TableHead>Acciones</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Por Hacer</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Teléfono</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Localización</TableHead>
                                                <TableHead>Información</TableHead>
                                                <TableHead>Próxima Llamada</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {seguimientosInCategory.length > 0 ? seguimientosInCategory.map((s) => (
                                            <TableRow key={s.id} data-state={selectedRows[s.id] ? "selected" : ""}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRows[s.id] || false}
                                                        onCheckedChange={(checked) => handleSelectRow(s.id, !!checked)}
                                                        aria-label={`Seleccionar fila ${s.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onSelect={() => handleEdit(s)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger><Move className="mr-2 h-4 w-4" /> Mover a Subsección</DropdownMenuSubTrigger>
                                                                    <DropdownMenuSubContent>
                                                                    {categories.map(cat => (
                                                                        <DropdownMenuItem key={cat.name} onSelect={() => onUpdateSeguimiento({ ...s, category: cat.name })}>
                                                                            {cat.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuSub>
                                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el seguimiento.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => onDeleteSeguimiento(s.id)}>Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                                <TableCell className="capitalize">{s.estado}</TableCell>
                                                <TableCell className="capitalize">{s.porHacer}</TableCell>
                                                <TableCell className="font-medium">{s.name}</TableCell>
                                                <TableCell>{s.phone}</TableCell>
                                                <TableCell>{s.email}</TableCell>
                                                <TableCell>{s.localizacion}</TableCell>
                                                <TableCell>
                                                    {s.informacion && (
                                                        <p 
                                                        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground max-w-xs truncate"
                                                        onClick={() => setViewingInfo(s.informacion || null)}
                                                        >
                                                        {s.informacion}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>{formatDisplayDate(s.siguienteLlamada)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                                    No hay seguimientos en esta subsección.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}


