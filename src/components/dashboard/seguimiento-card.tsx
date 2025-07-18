
"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { UserPlus, MoreHorizontal, Pencil, Trash2, CalendarIcon, Info, Settings, Plus, SquarePen } from "lucide-react";

const seguimientoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  localizacion: z.string().optional(),
  informacion: z.string().optional(),
  estado: z.string().optional(),
  porHacer: z.string().optional(),
  siguienteLlamada: z.date().optional().nullable(),
});

export type Seguimiento = z.infer<typeof seguimientoSchema> & { id: string, siguienteLlamada: string | null };

function OptionsSettingsDialog({ 
    estadoOptions, 
    porHacerOptions, 
    onSave, 
    open, 
    onOpenChange 
}: { 
    estadoOptions: string[], 
    porHacerOptions: string[], 
    onSave: (type: 'estado' | 'porHacer', options: string[]) => void, 
    open: boolean, 
    onOpenChange: (o: boolean) => void 
}) {
    const [currentEstado, setCurrentEstado] = useState(estadoOptions);
    const [currentPorHacer, setCurrentPorHacer] = useState(porHacerOptions);
    const [newEstado, setNewEstado] = useState("");
    const [newPorHacer, setNewPorHacer] = useState("");

    useEffect(() => {
        if (open) {
            setCurrentEstado(estadoOptions);
            setCurrentPorHacer(porHacerOptions);
        }
    }, [estadoOptions, porHacerOptions, open]);
    
    const handleSave = () => {
        onSave('estado', currentEstado);
        onSave('porHacer', currentPorHacer);
        onOpenChange(false);
    };
    
    const handleAddOption = (type: 'estado' | 'porHacer') => {
        if (type === 'estado' && newEstado.trim()) {
            setCurrentEstado([...currentEstado, newEstado.trim()]);
            setNewEstado("");
        } else if (type === 'porHacer' && newPorHacer.trim()) {
            setCurrentPorHacer([...currentPorHacer, newPorHacer.trim()]);
            setNewPorHacer("");
        }
    };

    const handleEditOption = (type: 'estado' | 'porHacer', index: number, value: string) => {
        if (type === 'estado') {
            const updated = [...currentEstado];
            updated[index] = value;
            setCurrentEstado(updated);
        } else {
            const updated = [...currentPorHacer];
            updated[index] = value;
            setCurrentPorHacer(updated);
        }
    };
    
    const handleDeleteOption = (type: 'estado' | 'porHacer', index: number) => {
        if (type === 'estado') {
            setCurrentEstado(currentEstado.filter((_, i) => i !== index));
        } else {
            setCurrentPorHacer(currentPorHacer.filter((_, i) => i !== index));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configurar Opciones de Seguimiento</DialogTitle>
                    <DialogDescription>Añade, edita o elimina las opciones de los desplegables.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
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
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function SeguimientoForm({ seguimiento, onSubmit, open, onOpenChange, estadoOptions, porHacerOptions }: { seguimiento?: Seguimiento, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, estadoOptions: string[], porHacerOptions: string[] }) {
    const form = useForm<z.infer<typeof seguimientoSchema>>({
        resolver: zodResolver(seguimientoSchema),
        defaultValues: { name: "", phone: "", email: "", localizacion: "", informacion: "", estado: estadoOptions[0], porHacer: porHacerOptions[0] },
    });

    useEffect(() => {
        if (open) {
            if (seguimiento) {
                 const callDate = seguimiento.siguienteLlamada 
                    ? parse(seguimiento.siguienteLlamada, 'dd/MM/yyyy', new Date())
                    : null;
                form.reset({
                    name: seguimiento.name || "",
                    phone: seguimiento.phone || "",
                    email: seguimiento.email || "",
                    localizacion: seguimiento.localizacion || "",
                    informacion: seguimiento.informacion || "",
                    estado: seguimiento.estado || estadoOptions[0],
                    porHacer: seguimiento.porHacer || porHacerOptions[0],
                    siguienteLlamada: callDate && isValid(callDate) ? callDate : null,
                });
            } else {
                form.reset({ name: "", phone: "", email: "", localizacion: "", informacion: "", estado: estadoOptions[0], porHacer: porHacerOptions[0], siguienteLlamada: undefined });
            }
        }
    }, [seguimiento, open, form, estadoOptions, porHacerOptions]);
    
    const handleSubmit = async (values: z.infer<typeof seguimientoSchema>) => {
        const submissionData = {
            ...seguimiento,
            ...values,
            siguienteLlamada: values.siguienteLlamada ? format(values.siguienteLlamada, "dd/MM/yyyy") : null,
        };
        onSubmit(submissionData);
        form.reset();
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {estadoOptions.map(option => <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="porHacer" render={({ field }) => (
                                <FormItem><FormLabel>Por Hacer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una acción" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {porHacerOptions.map(option => <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
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
                                        <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus weekStartsOn={1} locale={es} />
                                    </PopoverContent>
                                </Popover><FormMessage />
                            </FormItem>
                        )} />
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
    onSeguimientoOptionsChange
}: { 
    seguimientos: Seguimiento[], 
    onAddSeguimiento: (s: any) => void, 
    onUpdateSeguimiento: (s: any) => void, 
    onDeleteSeguimiento: (id: string) => void,
    estadoOptions: string[],
    porHacerOptions: string[],
    onSeguimientoOptionsChange: (type: 'estado' | 'porHacer', options: string[]) => void,
}) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeSeguimiento, setActiveSeguimiento] = useState<Seguimiento | undefined>(undefined);
    const [viewingInfo, setViewingInfo] = useState<string | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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
        // Intenta parsear como dd/MM/yyyy primero
        let date = parse(dateString, 'dd/MM/yyyy', new Date());
        // Si no es válido, intenta parsear como ISO string
        if (!isValid(date)) {
            date = new Date(dateString);
        }
        // Si sigue sin ser válido, devuelve el string original o N/A
        if (!isValid(date)) {
            return dateString;
        }
        return format(date, 'dd/MM/yyyy');
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

            <OptionsSettingsDialog
                open={isOptionsOpen}
                onOpenChange={setIsOptionsOpen}
                estadoOptions={estadoOptions}
                porHacerOptions={porHacerOptions}
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
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Seguimiento de Clientes</CardTitle>
                    <CardDescription>Gestiona nuevos contactos y su proceso inicial.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setIsOptionsOpen(true)}>
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Configurar Opciones</span>
                    </Button>
                    <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Seguimiento</Button>
                </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Acciones</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Localización</TableHead>
                            <TableHead>Información</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Por Hacer</TableHead>
                            <TableHead>Próxima Llamada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {seguimientos.map(s => (
                            <TableRow key={s.id}>
                                <TableCell>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(s)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
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
                                <TableCell className="capitalize">{s.estado}</TableCell>
                                <TableCell className="capitalize">{s.porHacer}</TableCell>
                                <TableCell>{formatDisplayDate(s.siguienteLlamada)}</TableCell>
                            </TableRow>
                        ))}
                         {seguimientos.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No hay seguimientos añadidos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
        </Card>
    );
}

    
