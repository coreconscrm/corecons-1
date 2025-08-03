
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
import { BookUser, MoreHorizontal, Pencil, Trash2, PlusCircle, Eye, FileText, Loader2, Presentation } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";


const prioritySchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  content: z.string().min(1, "El contenido no puede estar vacío."),
  date: z.date(),
  completed: z.boolean(),
  documentUrl: z.string().url().optional().or(z.literal('')),
  documentName: z.string().optional(),
});


export type DaniPriority = {
  id: string;
  title: string;
  content: string;
  date: any; // Firestore Timestamp
  completed: boolean;
  documentUrl?: string;
  documentName?: string;
};


function PriorityForm({ priority, onSubmit, open, onOpenChange }: { priority?: DaniPriority, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const form = useForm<z.infer<typeof prioritySchema>>({
        resolver: zodResolver(prioritySchema),
        defaultValues: {
            title: "",
            content: "",
            date: new Date(),
            completed: false,
            documentUrl: "",
            documentName: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (priority) {
                form.reset({
                    title: priority.title,
                    content: priority.content,
                    date: priority.date?.toDate ? priority.date.toDate() : new Date(),
                    completed: priority.completed || false,
                    documentUrl: priority.documentUrl || "",
                    documentName: priority.documentName || "",
                });
            } else {
                form.reset({
                    title: "",
                    content: "",
                    date: new Date(),
                    completed: false,
                    documentUrl: "",
                    documentName: "",
                });
            }
            setDocumentFile(null);
        }
    }, [priority, open, form]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setDocumentFile(file);
            form.setValue("documentName", file.name);
        }
    };
    
    const handleSubmit = async (values: z.infer<typeof prioritySchema>) => {
        setIsUploading(true);
        const priorityId = priority?.id || `priority-${Date.now()}`;
        let submissionData = { ...values, id: priorityId };

        try {
            if (documentFile) {
                const storageRef = ref(storage, `dani_priorities/${priorityId}/${documentFile.name}`);
                const snapshot = await uploadBytesResumable(storageRef, documentFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                submissionData.documentUrl = downloadURL;
                submissionData.documentName = documentFile.name;
            }

            onSubmit({ ...priority, ...submissionData });
            onOpenChange(false);
        } catch (error) {
            console.error("Error processing form:", error);
            toast({ variant: 'destructive', title: "Error al guardar", description: (error as Error).message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{priority ? "Editar Prioridad" : "Añadir Nueva Prioridad"}</DialogTitle>
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
                                        <Input placeholder="Ej: Revisar presupuesto cliente X" {...field} />
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
                         <FormItem>
                            <FormLabel>Documento</FormLabel>
                            <div className="flex items-center gap-4">
                               <FormControl>
                                  <Input type="file" onChange={handleFileChange} disabled={isUploading} className="flex-1" />
                               </FormControl>
                               {form.getValues("documentUrl") && !documentFile && (
                                   <Button variant="outline" size="icon" asChild>
                                       <a href={form.getValues("documentUrl")} target="_blank" rel="noopener noreferrer"><FileText className="h-5 w-5" /></a>
                                   </Button>
                               )}
                            </div>
                         </FormItem>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {priority ? "Guardar Cambios" : "Guardar Prioridad"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function DaniPrioritiesCard({ priorities, onAddPriority, onUpdatePriority, onDeletePriority }: { priorities: DaniPriority[], onAddPriority: (priority: any) => void, onUpdatePriority: (priority: any) => void, onDeletePriority: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activePriority, setActivePriority] = useState<DaniPriority | undefined>(undefined);
    const [viewingPriority, setViewingPriority] = useState<DaniPriority | null>(null);

    const handleEdit = (priority: DaniPriority) => {
        setActivePriority(priority);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActivePriority(undefined);
        setFormOpen(true);
    };

    const handleSubmit = (values: any) => {
        if (activePriority) {
            onUpdatePriority(values);
        } else {
            onAddPriority(values);
        }
    };
    
    const handleToggleCompleted = (priority: DaniPriority) => {
        onUpdatePriority({ id: priority.id, completed: !priority.completed });
    };

    const sortedPriorities = [...priorities].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
    });

    return (
        <Card>
            <PriorityForm
                priority={activePriority}
                onSubmit={handleSubmit}
                open={isFormOpen}
                onOpenChange={setFormOpen}
            />
            <Dialog open={!!viewingPriority} onOpenChange={() => setViewingPriority(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{viewingPriority?.title}</DialogTitle>
                         <DialogDescription>
                            {viewingPriority?.date?.toDate ? format(viewingPriority.date.toDate(), "d 'de' LLLL 'de' yyyy, HH:mm", { locale: es }) : 'Fecha no disponible'}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] my-4">
                        <div className="whitespace-pre-wrap pr-4 text-sm">{viewingPriority?.content}</div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><BookUser /> Prioridades para Dani</CardTitle>
                    <CardDescription>Un espacio para guardar y consultar las prioridades de Dani.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Prioridad</Button>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[200px]">Fecha</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead className="text-right w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPriorities.map(priority => (
                                <TableRow 
                                    key={priority.id} 
                                    className={cn("cursor-pointer", priority.completed && "text-muted-foreground line-through")}
                                >
                                    <TableCell className="cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={priority.completed}
                                            onCheckedChange={() => handleToggleCompleted(priority)}
                                            aria-label="Marcar como completado"
                                        />
                                    </TableCell>
                                    <TableCell onClick={() => setViewingPriority(priority)}>
                                      {priority.date?.toDate ? format(priority.date.toDate(), "dd/MM/yy HH:mm", { locale: es }) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-medium" onClick={() => setViewingPriority(priority)}>{priority.title}</TableCell>
                                    <TableCell>
                                        {priority.documentUrl && (
                                            <Button variant="outline" size="icon" asChild>
                                                <a href={priority.documentUrl} target="_blank" rel="noopener noreferrer" title={priority.documentName}>
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => setViewingPriority(priority)}><Eye className="mr-2" />Ver Prioridad</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(priority)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la prioridad permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeletePriority(priority.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedPriorities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No hay prioridades añadidas.
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

