
"use client"

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const reformistaSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
  category: z.string().optional(),
});

export type Reformista = z.infer<typeof reformistaSchema> & { id: string, order: number };

function ReformistaForm({ reformista, onSubmit, open, onOpenChange, categories }: { reformista?: Reformista, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void, categories: string[] }) {
    const form = useForm<z.infer<typeof reformistaSchema>>({
        resolver: zodResolver(reformistaSchema),
        defaultValues: { name: "", role: "Reformista", localidad: "", phone: "", email: "", instagram: "", web: "", category: "General" },
    });
    
    useEffect(() => {
        if(open) {
            if(reformista) {
                form.reset({
                    name: reformista.name || "",
                    role: reformista.role || "Reformista",
                    localidad: reformista.localidad || "",
                    phone: reformista.phone || "",
                    email: reformista.email || "",
                    instagram: reformista.instagram || "",
                    web: reformista.web || "",
                    category: reformista.category || "General",
                });
            } else {
                form.reset({ name: "", role: "Reformista", localidad: "", phone: "", email: "", instagram: "", web: "", category: "General" });
            }
        }
    }, [reformista, open, form]);

    const handleSubmit = async (values: z.infer<typeof reformistaSchema>) => {
        onSubmit({ ...reformista, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent className="max-w-2xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{reformista ? "Editar Reformista" : "Añadir Nuevo Reformista"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                     <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Reformas Integrales" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Especialidad</FormLabel><FormControl><Input placeholder="Reformas de baños y cocinas" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                           <FormItem>
                                <FormLabel>Categoría / Profesión</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? 'General'}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una profesión" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                           </FormItem>
                        )} />
                        <FormField control={form.control} name="localidad" render={({ field }) => (
                            <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Valencia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contacto@reformas.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@reformas" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.reformas.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background">
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{reformista ? "Guardar Cambios" : "Guardar Reformista"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ReformistasListCard({ reformistas, onAddReformista, onUpdateReformista, onDeleteReformista }: { reformistas: Reformista[], onAddReformista: (m: any) => void, onUpdateReformista: (m: any) => void, onDeleteReformista: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeReformista, setActiveReformista] = useState<Reformista | undefined>(undefined);
    const [localReformistas, setLocalReformistas] = useState<Reformista[]>([]);
    const [categories, setCategories] = useState<string[]>(['General']);
    const [newCategory, setNewCategory] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const sorted = [...reformistas].sort((a, b) => (a.order || 0) - (b.order || 0));
        setLocalReformistas(sorted);
        
        const uniqueCategories = Array.from(new Set(['General',...reformistas.map(r => r.category || 'General')]));
        setCategories(uniqueCategories);

    }, [reformistas]);

    const groupedReformistas = useMemo(() => {
        const groups: Record<string, Reformista[]> = {};
        
        localReformistas.forEach(r => {
            const category = r.category || 'General';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(r);
        });

        categories.forEach(cat => {
            if (!groups[cat]) {
                groups[cat] = [];
            }
        });
        
        return groups;
    }, [localReformistas, categories]);

    const handleEdit = (reformista: Reformista) => {
        setActiveReformista(reformista);
        setFormOpen(true);
    };
    
    const handleAdd = () => {
        setActiveReformista(undefined);
        setFormOpen(true);
    }

    const handleSubmit = (values: any) => {
        if (activeReformista) {
            onUpdateReformista(values);
        } else {
            const maxOrder = Math.max(0, ...reformistas.map(r => r.order || 0));
            onAddReformista({ ...values, order: maxOrder + 1 });
        }
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        const sourceCategory = source.droppableId;
        if (source.droppableId !== destination.droppableId) {
             toast({ title: "Acción no permitida", description: "Por favor, edita el reformista para cambiar su categoría.", variant: "destructive" });
             return;
        }

        const items = Array.from(groupedReformistas[sourceCategory]);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        const updatedReformistas = [...localReformistas];
        
        items.forEach((item, index) => {
            const originalIndex = updatedReformistas.findIndex(r => r.id === item.id);
            if (originalIndex !== -1) {
                updatedReformistas[originalIndex] = { ...updatedReformistas[originalIndex], order: index };
                onUpdateReformista({ ...updatedReformistas[originalIndex], order: index });
            }
        });
    };

    const handleAddCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory("");
            toast({ title: `Categoría "${newCategory}" creada`, description: "Ahora puedes asignarle reformistas."});
        }
    };

    return (
        <Card>
            <ReformistaForm 
              reformista={activeReformista} 
              onSubmit={handleSubmit} 
              open={isFormOpen} 
              onOpenChange={setFormOpen} 
              categories={categories}
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Reformistas</CardTitle>
                    <CardDescription>Empresas reformistas que colaboran en proyectos. Puedes reordenarlos arrastrando.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                     <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Nueva profesión..." 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)} 
                            className="h-9"
                        />
                        <Button size="sm" onClick={handleAddCategory}><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
                    </div>
                    <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Reformista</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <DragDropContext onDragEnd={onDragEnd}>
                    <Accordion type="multiple" defaultValue={categories} className="w-full space-y-4">
                        {Object.entries(groupedReformistas).map(([category, reformistasInCategory]) => (
                            <AccordionItem value={category} key={category} className="border rounded-md px-4">
                                <AccordionTrigger className="text-lg font-semibold">{category} ({reformistasInCategory.length})</AccordionTrigger>
                                <AccordionContent>
                                    <Droppable droppableId={category}>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps} className={`w-full overflow-x-auto rounded-md ${snapshot.isDraggingOver ? 'bg-secondary' : ''}`}>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-8"></TableHead>
                                                            <TableHead>Nombre</TableHead>
                                                            <TableHead>Especialidad</TableHead>
                                                            <TableHead>Localidad</TableHead>
                                                            <TableHead>Teléfono</TableHead>
                                                            <TableHead>Email</TableHead>
                                                            <TableHead>Instagram</TableHead>
                                                            <TableHead>Web</TableHead>
                                                            <TableHead className="text-right">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {reformistasInCategory.length > 0 ? reformistasInCategory.map((reformista, index) => (
                                                            <Draggable key={reformista.id} draggableId={reformista.id} index={index}>
                                                                {(provided) => (
                                                                    <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                                                        <TableCell {...provided.dragHandleProps}><GripVertical className="text-muted-foreground" /></TableCell>
                                                                        <TableCell className="font-medium">{reformista.name}</TableCell>
                                                                        <TableCell>{reformista.role}</TableCell>
                                                                        <TableCell>{reformista.localidad}</TableCell>
                                                                        <TableCell>{reformista.phone}</TableCell>
                                                                        <TableCell>{reformista.email}</TableCell>
                                                                        <TableCell>{reformista.instagram}</TableCell>
                                                                        <TableCell>{reformista.web}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <AlertDialog>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                                                    <DropdownMenuContent>
                                                                                        <DropdownMenuItem onSelect={() => handleEdit(reformista)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                                                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el reformista.</AlertDialogDescription></AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => onDeleteReformista(reformista.id)}>Eliminar</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </Draggable>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell colSpan={9} className="h-24 text-center">
                                                                    No hay reformistas en esta categoría.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        {provided.placeholder}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </Droppable>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </DragDropContext>
            </CardContent>
        </Card>
    );
}

    