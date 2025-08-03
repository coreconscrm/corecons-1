
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
import { MoreHorizontal, Pencil, Trash2, PlusCircle, Eye, FileText, Loader2, Presentation, CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

const presentarSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  nombre: z.string().optional(),
  telefono: z.string().optional(),
  poblacion: z.string().optional(),
  descripcion: z.string().min(1, "La descripción es requerida."),
  documentFile: z.any().optional(),
  documentUrl: z.string().url().optional().or(z.literal('')),
  documentName: z.string().optional(),
  presentationDate: z.date().optional().nullable(),
});

export type APresentarItem = {
  id: string;
  title: string;
  nombre?: string;
  telefono?: string;
  poblacion?: string;
  descripcion: string;
  documentUrl?: string;
  documentName?: string;
  presentationDate?: any; // Firestore Timestamp
};

function PresentarForm({ item, open, onOpenChange, onSubmit }: { item?: APresentarItem, open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (values: any) => Promise<void> }) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const form = useForm<z.infer<typeof presentarSchema>>({
        resolver: zodResolver(presentarSchema),
    });

    const documentFileRef = form.register("documentFile");
    
    useEffect(() => {
        if (open) {
            const defaultValues = {
                title: item?.title || "",
                nombre: item?.nombre || "",
                telefono: item?.telefono || "",
                poblacion: item?.poblacion || "",
                descripcion: item?.descripcion || "",
                documentUrl: item?.documentUrl || "",
                documentName: item?.documentName || "",
                presentationDate: item?.presentationDate?.toDate() || null,
            };
            form.reset(defaultValues);
            setIsUploading(false);
            setUploadProgress(null);
        }
    }, [open, form, item]);
    
    const handleSubmit = async (values: z.infer<typeof presentarSchema>) => {
        setIsUploading(true);
        setUploadProgress(0);
        const presentacionId = item?.id || `presentar-${Date.now()}`;
        let submissionData: any = { ...values, id: presentacionId, date: new Date() };
        
        const documentFile = values.documentFile?.[0];

        try {
            if (documentFile) {
                const storageRef = ref(storage, `a_presentar/${presentacionId}/${documentFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, documentFile);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(Math.round(progress));
                        },
                        (error) => {
                            console.error("Upload failed:", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            submissionData.documentUrl = downloadURL;
                            submissionData.documentName = documentFile.name;
                            resolve();
                        }
                    );
                });
            } else {
                submissionData.documentUrl = item?.documentUrl || "";
                submissionData.documentName = item?.documentName || "";
            }
            
            delete submissionData.documentFile;

            await onSubmit(submissionData);
            toast({ title: "Guardado", description: "La entrada 'A Presentar' se ha guardado correctamente." });
            onOpenChange(false);
        } catch (error) {
            console.error("Error processing form:", error);
            toast({ variant: 'destructive', title: "Error al guardar", description: (error as Error).message });
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{item ? "Editar" : "Añadir a"} Presentar</DialogTitle>
                    <DialogDescription>
                        {item ? "Edita los detalles de esta entrada." : "Crea una nueva entrada para presentar a un cliente, arquitecto, etc."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej: Presentación para Cliente X" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="nombre" render={({ field }) => (
                                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre del contacto" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="telefono" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Teléfono de contacto" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                            )} />
                         </div>
                        <FormField control={form.control} name="poblacion" render={({ field }) => (
                            <FormItem><FormLabel>Población</FormLabel><FormControl><Input placeholder="Población" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="descripcion" render={({ field }) => (
                            <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Detalles de la presentación..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormItem>
                            <FormLabel>Adjuntar Archivo (Opcional)</FormLabel>
                            <FormControl>
                                <Input type="file" {...documentFileRef} disabled={isUploading} />
                            </FormControl>
                            {item?.documentUrl && <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{item.documentName}</a>}
                         </FormItem>
                         <FormField
                            control={form.control}
                            name="presentationDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Presentación</FormLabel>
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
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isUploading}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? `Subiendo (${uploadProgress}%)` : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function APresentarCard({ items, onAddItem, onUpdateItem, onDeleteItem }: { items: APresentarItem[], onAddItem: (item: any) => Promise<void>, onUpdateItem: (item: any) => Promise<void>, onDeleteItem: (id: string) => Promise<void> }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<APresentarItem | undefined>(undefined);
    const [viewingItem, setViewingItem] = useState<APresentarItem | null>(null);

    const handleEdit = (item: APresentarItem) => {
        setActiveItem(item);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveItem(undefined);
        setFormOpen(true);
    };

    const handleSubmit = async (values: any) => {
        if (activeItem) {
            await onUpdateItem(values);
        } else {
            await onAddItem(values);
        }
    };
    
    const sortedItems = [...items].sort((a, b) => {
        const dateA = a.presentationDate?.toDate ? a.presentationDate.toDate().getTime() : 0;
        const dateB = b.presentationDate?.toDate ? b.presentationDate.toDate().getTime() : 0;
        return dateB - dateA;
    });

    return (
        <Card>
            <PresentarForm
                item={activeItem}
                onSubmit={handleSubmit}
                open={isFormOpen}
                onOpenChange={setFormOpen}
            />
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{viewingItem?.title}</DialogTitle>
                         <DialogDescription>
                            Fecha de presentación: {viewingItem?.presentationDate?.toDate ? format(viewingItem.presentationDate.toDate(), "d 'de' LLLL 'de' yyyy", { locale: es }) : 'No especificada'}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] my-4">
                        <div className="space-y-4">
                            <div><span className="font-semibold">Nombre:</span> {viewingItem?.nombre}</div>
                            <div><span className="font-semibold">Teléfono:</span> {viewingItem?.telefono}</div>
                            <div><span className="font-semibold">Población:</span> {viewingItem?.poblacion}</div>
                            <div className="whitespace-pre-wrap pr-4 text-sm"><span className="font-semibold">Descripción:</span> {viewingItem?.descripcion}</div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Presentation /> A Presentar</CardTitle>
                    <CardDescription>Gestiona las presentaciones pendientes.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir</Button>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha Presentación</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Población</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead className="text-right w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                      {item.presentationDate?.toDate ? format(item.presentationDate.toDate(), "dd/MM/yyyy", { locale: es }) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.nombre}</TableCell>
                                    <TableCell>{item.telefono}</TableCell>
                                    <TableCell>{item.poblacion}</TableCell>
                                    <TableCell>
                                        {item.documentUrl && (
                                            <Button variant="outline" size="icon" asChild>
                                                <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" title={item.documentName}>
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => setViewingItem(item)}><Eye className="mr-2" />Ver Detalles</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(item)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la entrada permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteItem(item.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No hay elementos "A Presentar".
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

