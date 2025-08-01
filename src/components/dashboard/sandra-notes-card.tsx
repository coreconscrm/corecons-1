
"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, MoreHorizontal, Pencil, Trash2, PlusCircle, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const noteSchema = z.object({
  title: z.string().min(1, "El título es requerido.").optional(),
  content: z.string().min(1, "El contenido no puede estar vacío.").optional(),
  provincia: z.string().min(1, "La provincia es requerida.").optional(),
  category: z.enum(["General", "Terreno", "Arquitecto"]),
  date: z.date(),
  completed: z.boolean(),
});

export type SandraNote = {
  id: string;
  category: "General" | "Terreno" | "Arquitecto";
  title?: string;
  content?: string;
  provincia?: string;
  date: any; // Firestore Timestamp
  completed: boolean;
};

function NoteForm({ note, onSubmit, open, onOpenChange }: { note?: SandraNote, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof noteSchema>>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            date: new Date(),
            completed: false,
            category: "General",
        },
    });

    const category = form.watch("category");

    useEffect(() => {
        if (open) {
            if (note) {
                form.reset({
                    title: note.title,
                    content: note.content,
                    provincia: note.provincia,
                    category: note.category,
                    date: note.date?.toDate ? note.date.toDate() : new Date(),
                    completed: note.completed || false,
                });
            } else {
                 form.reset({
                    title: "",
                    content: "",
                    provincia: "",
                    category: "General",
                    date: new Date(),
                    completed: false,
                });
            }
        }
    }, [note, open, form]);

    const handleSubmit = (values: z.infer<typeof noteSchema>) => {
        onSubmit({ ...note, ...values });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{note ? "Editar Apunte" : "Añadir Nuevo Apunte"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Apunte</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!note}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="General">Nota General</SelectItem>
                                    <SelectItem value="Terreno">Terreno</SelectItem>
                                    <SelectItem value="Arquitecto">Arquitecto</SelectItem>
                                  </SelectContent>
                                </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {category === "General" ? (
                            <>
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej: Resumen de llamada" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="content" render={({ field }) => (
                                    <FormItem><FormLabel>Contenido</FormLabel><FormControl><Textarea placeholder="Pega o escribe tu texto aquí..." {...field} value={field.value ?? ''} rows={10} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </>
                        ) : (
                             <>
                                <FormField control={form.control} name="provincia" render={({ field }) => (
                                    <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input placeholder="Ej: Barcelona" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="content" render={({ field }) => (
                                    <FormItem><FormLabel>Texto</FormLabel><FormControl><Textarea placeholder="Escribe los detalles aquí..." {...field} value={field.value ?? ''} rows={10} /></FormControl><FormMessage /></FormItem>
                                )}/>
                             </>
                        )}
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{note ? "Guardar Cambios" : "Guardar Apunte"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function SandraNotesCard({ notes, onAddNote, onUpdateNote, onDeleteNote }: { notes: SandraNote[], onAddNote: (note: any) => void, onUpdateNote: (note: any) => void, onDeleteNote: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeNote, setActiveNote] = useState<SandraNote | undefined>(undefined);
    const [viewingNote, setViewingNote] = useState<SandraNote | null>(null);
    const [activeTab, setActiveTab] = useState("General");
    
    const { generalNotes, terrenoNotes, arquitectoNotes } = useMemo(() => {
        const generalNotes = notes.filter(n => n.category === "General" || !n.category).sort((a,b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
        const terrenoNotes = notes.filter(n => n.category === "Terreno").sort((a,b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
        const arquitectoNotes = notes.filter(n => n.category === "Arquitecto").sort((a,b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
        return { generalNotes, terrenoNotes, arquitectoNotes };
    }, [notes]);

    const handleEdit = (note: SandraNote) => {
        setActiveNote(note);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveNote(undefined);
        setFormOpen(true);
    };

    const handleSubmit = (values: any) => {
        if (activeNote) {
            onUpdateNote(values);
        } else {
            onAddNote(values);
        }
    };
    
    const handleToggleCompleted = (note: SandraNote) => {
        onUpdateNote({ ...note, completed: !note.completed });
    };

    return (
        <Card>
            <NoteForm
                note={activeNote}
                onSubmit={handleSubmit}
                open={isFormOpen}
                onOpenChange={setFormOpen}
            />
            <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{viewingNote?.title || viewingNote?.provincia}</DialogTitle>
                         <DialogDescription>
                            {viewingNote?.date?.toDate ? format(viewingNote.date.toDate(), "d 'de' LLLL 'de' yyyy, HH:mm", { locale: es }) : 'Fecha no disponible'}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] my-4">
                        <div className="whitespace-pre-wrap pr-4 text-sm">{viewingNote?.content}</div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><BookUser /> Apuntes de Sandra</CardTitle>
                    <CardDescription>Un espacio para guardar y consultar las notas de Sandra.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Apunte</Button>
            </CardHeader>
            <CardContent>
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="General">Notas Generales</TabsTrigger>
                        <TabsTrigger value="Terreno">Terrenos</TabsTrigger>
                        <TabsTrigger value="Arquitecto">Arquitectos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="General" className="mt-4">
                        <div className="w-full overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead className="w-[200px]">Fecha</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead className="text-right w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {generalNotes.map(note => (
                                        <TableRow key={note.id} className={cn("cursor-pointer", note.completed && "text-muted-foreground line-through")}>
                                            <TableCell className="cursor-default" onClick={(e) => e.stopPropagation()}><Checkbox checked={note.completed} onCheckedChange={() => handleToggleCompleted(note)} aria-label="Marcar como completado"/></TableCell>
                                            <TableCell onClick={() => setViewingNote(note)}>{note.date?.toDate ? format(note.date.toDate(), "dd/MM/yy HH:mm", { locale: es }) : 'N/A'}</TableCell>
                                            <TableCell className="font-medium" onClick={() => setViewingNote(note)}>{note.title}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setViewingNote(note)}><Eye className="mr-2" />Ver Nota</DropdownMenuItem><DropdownMenuItem onSelect={() => handleEdit(note)}><Pencil className="mr-2" />Editar</DropdownMenuItem><AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la nota permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteNote(note.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
                                        </TableRow>
                                    ))}
                                    {generalNotes.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No hay notas generales añadidas.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="Terreno" className="mt-4">
                         <div className="w-full overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Provincia</TableHead><TableHead>Texto</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {terrenoNotes.map(note => (
                                        <TableRow key={note.id} className={cn("cursor-pointer", note.completed && "text-muted-foreground line-through")}>
                                            <TableCell className="cursor-default" onClick={(e) => e.stopPropagation()}><Checkbox checked={note.completed} onCheckedChange={() => handleToggleCompleted(note)}/></TableCell>
                                            <TableCell onClick={() => setViewingNote(note)}>{note.provincia}</TableCell>
                                            <TableCell className="font-medium truncate max-w-xs" onClick={() => setViewingNote(note)}>{note.content}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setViewingNote(note)}><Eye className="mr-2" />Ver</DropdownMenuItem><DropdownMenuItem onSelect={() => handleEdit(note)}><Pencil className="mr-2" />Editar</DropdownMenuItem><AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el apunte.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteNote(note.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
                                        </TableRow>
                                    ))}
                                    {terrenoNotes.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No hay terrenos añadidos.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                         </div>
                    </TabsContent>
                    <TabsContent value="Arquitecto" className="mt-4">
                         <div className="w-full overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Provincia</TableHead><TableHead>Texto</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {arquitectoNotes.map(note => (
                                        <TableRow key={note.id} className={cn("cursor-pointer", note.completed && "text-muted-foreground line-through")}>
                                            <TableCell className="cursor-default" onClick={(e) => e.stopPropagation()}><Checkbox checked={note.completed} onCheckedChange={() => handleToggleCompleted(note)}/></TableCell>
                                            <TableCell onClick={() => setViewingNote(note)}>{note.provincia}</TableCell>
                                            <TableCell className="font-medium truncate max-w-xs" onClick={() => setViewingNote(note)}>{note.content}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setViewingNote(note)}><Eye className="mr-2" />Ver</DropdownMenuItem><DropdownMenuItem onSelect={() => handleEdit(note)}><Pencil className="mr-2" />Editar</DropdownMenuItem><AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el apunte.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteNote(note.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
                                        </TableRow>
                                    ))}
                                    {arquitectoNotes.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No hay arquitectos añadidos.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
