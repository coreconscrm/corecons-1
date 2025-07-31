
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

const noteSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  content: z.string().min(1, "El contenido no puede estar vacío."),
  date: z.date(),
});

export type SandraNote = {
  id: string;
  title: string;
  content: string;
  date: any; // Firestore Timestamp
};

function NoteForm({ note, onSubmit, open, onOpenChange }: { note?: SandraNote, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof noteSchema>>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            title: "",
            content: "",
            date: new Date(),
        },
    });

    useEffect(() => {
        if (open) {
            if (note) {
                form.reset({
                    title: note.title,
                    content: note.content,
                    date: note.date?.toDate ? note.date.toDate() : new Date(),
                });
            } else {
                form.reset({
                    title: "",
                    content: "",
                    date: new Date(),
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
                    <DialogTitle>{note ? "Editar Nota" : "Añadir Nueva Nota"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Resumen de llamada con cliente" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contenido</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Pega o escribe tu texto aquí..." {...field} rows={10} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{note ? "Guardar Cambios" : "Guardar Nota"}</Button>
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

    const sortedNotes = [...notes].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
    });

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
                        <DialogTitle>{viewingNote?.title}</DialogTitle>
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
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Nota</Button>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Fecha</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead className="text-right w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedNotes.map(note => (
                                <TableRow 
                                    key={note.id} 
                                    onClick={() => setViewingNote(note)}
                                    className="cursor-pointer"
                                >
                                    <TableCell>{note.date?.toDate ? format(note.date.toDate(), "d MMM yyyy, HH:mm", { locale: es }) : 'N/A'}</TableCell>
                                    <TableCell className="font-medium">{note.title}</TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => setViewingNote(note)}><Eye className="mr-2" />Ver Nota</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(note)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la nota permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteNote(note.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedNotes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No hay notas añadidas.
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
