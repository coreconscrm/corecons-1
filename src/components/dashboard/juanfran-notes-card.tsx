
"use client"

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChecks, PlusCircle, Trash2, Pencil, CheckCircle2, NotebookText, MoreHorizontal, Eye, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Schemas ---
const checklistItemSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío."),
  completed: z.boolean(),
});

const checklistSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  items: z.array(checklistItemSchema).optional(),
});

const noteSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  content: z.string().min(1, "El contenido no puede estar vacío."),
});

const passChecklistSchema = z.object({
    targetUserId: z.string().min(1, "Debes seleccionar un destinatario."),
    annotations: z.string().optional(),
});

// --- Types ---
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
type TeamMember = { id: string, name: string };
export type JuanFranNote = {
  id: string;
  type: 'note' | 'checklist';
  title: string;
  content?: string; // For notes
  items?: ChecklistItem[]; // For checklists
  date?: any; // Firestore Timestamp
  completed?: boolean; // For simple notes/checklists to be archived
};


// --- Forms ---
function PassChecklistForm({
    open,
    onOpenChange,
    team,
    onPass,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: TeamMember[];
    onPass: (targetUserId: string, annotations: string) => void;
}) {
    const form = useForm<z.infer<typeof passChecklistSchema>>({
        resolver: zodResolver(passChecklistSchema),
        defaultValues: { annotations: "" },
    });

    const handleSubmit = (values: z.infer<typeof passChecklistSchema>) => {
        onPass(values.targetUserId, values.annotations || "");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pasar Checklist a Compañero</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="targetUserId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pasar a:</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecciona un compañero..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="annotations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Anotaciones (opcional)</FormLabel>
                                    <FormControl><Textarea placeholder="Añade un comentario..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">Pasar Checklist</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ChecklistForm({ checklist, onSubmit, open, onOpenChange }: { checklist?: JuanFranNote, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof checklistSchema>>({
        resolver: zodResolver(checklistSchema),
        defaultValues: { title: "", items: [{ text: "", completed: false }] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    useEffect(() => {
        if (open) {
            if (checklist) {
                form.reset({
                    title: checklist.title,
                    items: checklist.items && checklist.items.length > 0 ? checklist.items : [{ text: "", completed: false }],
                });
            } else {
                form.reset({
                    title: "",
                    items: [{ text: "", completed: false }],
                });
            }
        }
    }, [checklist, open, form]);

    const handleSubmit = (values: z.infer<typeof checklistSchema>) => {
        onSubmit({ ...checklist, ...values, type: 'checklist', date: new Date() });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{checklist ? "Editar Checklist" : "Nueva Checklist"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título de la Checklist</FormLabel>
                                    <FormControl><Input placeholder="Ej: Tareas de la semana" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <FormField control={form.control} name={`items.${index}.completed`} render={({ field }) => (
                                        <FormItem><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name={`items.${index}.text`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input placeholder="Nueva tarea..." {...field} /></FormControl></FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "", completed: false })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tarea
                        </Button>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{checklist ? "Guardar Cambios" : "Guardar Checklist"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function NoteForm({ note, onSubmit, open, onOpenChange }: { note?: JuanFranNote, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof noteSchema>>({
        resolver: zodResolver(noteSchema),
        defaultValues: { title: "", content: "" },
    });

    useEffect(() => {
        if (open) {
            if (note) {
                form.reset({
                    title: note.title,
                    content: note.content || "",
                });
            } else {
                form.reset({ title: "", content: "" });
            }
        }
    }, [note, open, form]);

    const handleSubmit = (values: z.infer<typeof noteSchema>) => {
        onSubmit({ ...note, ...values, type: 'note', date: new Date(), completed: false });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{note ? "Editar Apunte" : "Nuevo Apunte"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl><Input placeholder="Ej: Resumen de llamada con cliente" {...field} /></FormControl>
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
                            <Button type="submit">{note ? "Guardar Cambios" : "Guardar Apunte"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Component ---
export function JuanfranNotesCard({
    notes,
    onAddJuanfranNote,
    onUpdateJuanfranNote,
    onDeleteJuanfranNote,
    team,
    onPassChecklist,
}: {
    notes: JuanFranNote[];
    onAddJuanfranNote: (note: any) => void;
    onUpdateJuanfranNote: (note: any) => void;
    onDeleteJuanfranNote: (id: string) => void;
    team: TeamMember[];
    onPassChecklist: (item: JuanFranNote, targetUserId: string, annotations: string) => void;
}) {
    const [activeForm, setActiveForm] = useState<'note' | 'checklist' | 'pass' | null>(null);
    const [editingItem, setEditingItem] = useState<JuanFranNote | undefined>(undefined);
    const [viewingNote, setViewingNote] = useState<JuanFranNote | null>(null);
    const [passingItem, setPassingItem] = useState<JuanFranNote | null>(null);

    const handleEdit = (item: JuanFranNote) => {
        setEditingItem(item);
        setActiveForm(item.type);
    };

    const handleAdd = (type: 'note' | 'checklist') => {
        setEditingItem(undefined);
        setActiveForm(type);
    };
    
    const closeForms = () => {
        setEditingItem(undefined);
        setActiveForm(null);
    }

    const handleSubmit = (values: any) => {
        if (editingItem) {
            onUpdateJuanfranNote(values);
        } else {
            onAddJuanfranNote(values);
        }
    };
    
    const handleToggleItem = (checklist: JuanFranNote, itemIndex: number) => {
        if (!checklist.items) return;
        const newItems = [...checklist.items];
        newItems[itemIndex] = { ...newItems[itemIndex], completed: !newItems[itemIndex].completed };
        onUpdateJuanfranNote({ ...checklist, items: newItems });
    };
    
    const handleToggleCompleted = (note: JuanFranNote) => {
        onUpdateJuanfranNote({ ...note, completed: !note.completed });
    };

    const handlePassClick = (item: JuanFranNote) => {
        setPassingItem(item);
    };

    const calculateProgress = (items: ChecklistItem[] = []) => {
        if (items.length === 0) return 0;
        const completedCount = items.filter(item => item.completed).length;
        return (completedCount / items.length) * 100;
    };
    
    const simpleNotes = notes.filter(n => n.type === 'note');
    const checklists = notes.filter(n => n.type === 'checklist');

    return (
        <Card>
            {passingItem && (
                <PassChecklistForm
                    open={!!passingItem}
                    onOpenChange={(open) => !open && setPassingItem(null)}
                    team={team}
                    onPass={(targetUserId, annotations) => {
                        onPassChecklist(passingItem, targetUserId, annotations);
                        setPassingItem(null);
                    }}
                />
            )}
            <ChecklistForm
                checklist={editingItem?.type === 'checklist' ? editingItem : undefined}
                onSubmit={handleSubmit}
                open={activeForm === 'checklist'}
                onOpenChange={(open) => !open && closeForms()}
            />
            <NoteForm
                note={editingItem?.type === 'note' ? editingItem : undefined}
                onSubmit={handleSubmit}
                open={activeForm === 'note'}
                onOpenChange={(open) => !open && closeForms()}
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
                    <CardTitle className="flex items-center gap-2"><ListChecks /> Apuntes de Juanfran</CardTitle>
                    <CardDescription>Gestiona checklists y apuntes rápidos.</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Añadir</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleAdd('note')}><NotebookText className="mr-2" />Nuevo Apunte</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAdd('checklist')}><ListChecks className="mr-2" />Nueva Checklist</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Simple Notes Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-3">Apuntes Rápidos</h3>
                    {simpleNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {simpleNotes.map(note => (
                            <Card 
                                key={note.id} 
                                className={cn("flex flex-col cursor-pointer hover:border-primary", note.completed && "bg-muted/50 text-muted-foreground")}
                                onClick={() => setViewingNote(note)}
                            >
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className={cn("text-lg", note.completed && "line-through")}>{note.title}</CardTitle>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => setViewingNote(note)}><Eye className="mr-2" />Ver</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(note)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará el apunte permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteJuanfranNote(note.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                     <p className={cn("text-sm text-muted-foreground truncate", note.completed && "line-through")}>
                                        {note.content}
                                    </p>
                                </CardContent>
                                <CardFooter onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={`note-check-${note.id}`} checked={note.completed} onCheckedChange={() => handleToggleCompleted(note)} />
                                        <label htmlFor={`note-check-${note.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Archivar
                                        </label>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                        </div>
                    ) : (
                         <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No hay apuntes rápidos.</p>
                        </div>
                    )}
                </div>

                {/* Checklists Section */}
                <div>
                     <h3 className="text-xl font-semibold mb-3">Checklists</h3>
                     {checklists.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {checklists.map(checklist => (
                                <AccordionItem value={checklist.id} key={checklist.id} className="border rounded-md px-4">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex-1 text-left">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-semibold text-lg">{checklist.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Progress value={calculateProgress(checklist.items)} className="w-1/3 h-2" />
                                                <span className="text-sm text-muted-foreground">
                                                    {(checklist.items || []).filter(i => i.completed).length} de {(checklist.items || []).length} completadas
                                                </span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 mb-4">
                                            {(checklist.items || []).map((item, index) => (
                                                <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50">
                                                    <Checkbox id={`item-${checklist.id}-${index}`} checked={item.completed} onCheckedChange={() => handleToggleItem(checklist, index)} />
                                                    <label htmlFor={`item-${checklist.id}-${index}`} className={cn("flex-1 text-sm cursor-pointer", item.completed && "line-through text-muted-foreground")}>{item.text}</label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handlePassClick(checklist)}><Send className="mr-2 h-4 w-4" />Pasar</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(checklist)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la checklist "{checklist.title}" y todas sus tareas.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteJuanfranNote(checklist.id)}>Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <CheckCircle2 className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Todo en orden</h3>
                            <p className="mt-1 text-sm">No hay checklists. ¡Crea una para empezar!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
