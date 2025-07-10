
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const documentSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  file: z.any().refine(file => file?.length > 0, "Se requiere un archivo."),
});

export type Document = {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
};

function DocumentForm({ onSubmit, open, onOpenChange }: { onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: { title: "", description: "" },
    });
    
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (values: z.infer<typeof documentSchema>) => {
        setIsUploading(true);
        const file = values.file[0];
        const docId = `doc-${Date.now()}`;
        
        try {
            const storageRef = ref(storage, `general_documents/${docId}/${file.name}`);
            const snapshot = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const submissionData = {
                title: values.title,
                description: values.description,
                fileUrl: downloadURL,
                fileName: file.name
            };
            
            onSubmit(submissionData);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Error processing form: ", error);
            toast({ variant: 'destructive', title: "Error al guardar", description: `No se pudo subir el documento. Error: ${(error as Error).message}` });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Documento</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Título del Documento</FormLabel><FormControl><Input placeholder="Ej: Póliza de Seguro RC" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea placeholder="Añade una breve descripción..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { onChange, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>Archivo</FormLabel>
                                    <FormControl>
                                        <Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Subir Documento
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function DocumentsCard({ documents, onAddDocument, onDeleteDocument }: { documents: Document[], onAddDocument: (doc: any) => void, onDeleteDocument: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    return (
        <Card>
            <DocumentForm onSubmit={onAddDocument} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Documentos Generales</CardTitle>
                    <CardDescription>Gestiona documentos importantes de la empresa.</CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}><Upload className="mr-2 h-4 w-4" />Subir Documento</Button>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Archivo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length > 0 ? documents.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{doc.description}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />{doc.fileName}
                                            </a>
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el documento.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteDocument(doc.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No hay documentos subidos.
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

