
"use client"

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";


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

export type Reformista = z.infer<typeof reformistaSchema> & { id: string };

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
                    role: reformista.role || "",
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{reformista ? "Editar Reformista" : "Añadir Nuevo Reformista"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Reformas Integrales" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Reformas de baños y cocinas" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                           <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="Fontanería, Electricidad..." {...field} value={field.value ?? 'General'} /></FormControl><FormMessage /></FormItem>
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
                        <DialogFooter>
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
    const [newCategory, setNewCategory] = useState("");

    const groupedReformistas = useMemo(() => {
        return reformistas.reduce((acc, reformista) => {
            const category = reformista.category || "General";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(reformista);
            return acc;
        }, {} as Record<string, Reformista[]>);
    }, [reformistas]);

    const [categories, setCategories] = useState(Object.keys(groupedReformistas));

    useEffect(() => {
        const newCategories = Object.keys(groupedReformistas);
        if (JSON.stringify(newCategories.sort()) !== JSON.stringify(categories.sort())) {
            setCategories(newCategories);
        }
    }, [groupedReformistas, categories]);


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
            onAddReformista(values);
        }
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const reformistaToMove = reformistas.find(r => r.id === draggableId);
        if (reformistaToMove) {
            onUpdateReformista({ ...reformistaToMove, category: destination.droppableId });
        }
    };
    
    const handleAddCategory = () => {
      if (newCategory && !categories.includes(newCategory)) {
        setCategories([...categories, newCategory]);
        setNewCategory("");
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
                    <CardDescription>Empresas reformistas que colaboran en proyectos.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Nueva categoría" 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)} 
                        className="w-48"
                    />
                    <Button size="icon" onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
                    <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Reformista</Button>
                </div>
            </CardHeader>
            <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Accordion type="multiple" defaultValue={categories} className="w-full space-y-4">
                        {categories.map((category) => (
                            <Droppable droppableId={category} key={category}>
                                {(provided) => (
                                    <AccordionItem value={category} className="border rounded-md px-4" ref={provided.innerRef} {...provided.droppableProps}>
                                        <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="w-full overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-8"></TableHead>
                                                            <TableHead>Nombre</TableHead>
                                                            <TableHead>Rol</TableHead>
                                                            <TableHead>Localidad</TableHead>
                                                            <TableHead>Teléfono</TableHead>
                                                            <TableHead>Email</TableHead>
                                                            <TableHead>Instagram</TableHead>
                                                            <TableHead>Web</TableHead>
                                                            <TableHead className="text-right">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(groupedReformistas[category] || []).map((reformista, index) => (
                                                            <Draggable key={reformista.id} draggableId={reformista.id} index={index}>
                                                                {(provided) => (
                                                                    <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                        <TableCell><GripVertical className="text-muted-foreground" /></TableCell>
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
                                                        ))}
                                                        {provided.placeholder}
                                                        {(!groupedReformistas[category] || groupedReformistas[category].length === 0) && (
                                                            <TableRow>
                                                                <TableCell colSpan={9} className="h-24 text-center">
                                                                    Arrastra reformistas aquí o edítalos para asignarlos a esta categoría.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                            </Droppable>
                        ))}
                    </Accordion>
                </DragDropContext>
            </CardContent>
        </Card>
    );
}
