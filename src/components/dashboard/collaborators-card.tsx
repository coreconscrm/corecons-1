
"use client"

import { useState, useEffect } from "react";
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
import { UserPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";


const collaboratorSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
});

export type Collaborator = z.infer<typeof collaboratorSchema> & { id: string };

function CollaboratorForm({ collaborator, onSubmit, open, onOpenChange }: { collaborator?: Collaborator, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof collaboratorSchema>>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: { name: "", role: "", localidad: "", phone: "", email: "", instagram: "", web: "" },
    });
    
    useEffect(() => {
        if(open) {
            if(collaborator) {
                form.reset({
                    name: collaborator.name || "",
                    role: collaborator.role || "",
                    localidad: collaborator.localidad || "",
                    phone: collaborator.phone || "",
                    email: collaborator.email || "",
                    instagram: collaborator.instagram || "",
                    web: collaborator.web || "",
                });
            } else {
                form.reset({ name: "", role: "", localidad: "", phone: "", email: "", instagram: "", web: "" });
            }
        }
    }, [collaborator, open, form]);

    const handleSubmit = async (values: z.infer<typeof collaboratorSchema>) => {
        onSubmit({ ...collaborator, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{collaborator ? "Editar Arquitecto" : "Añadir Nuevo Arquitecto"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ana Torres" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Arquitecto Técnico" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="localidad" render={({ field }) => (
                            <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Barcelona" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ana.t@email.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@ana_arquitectura" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.anaarquitectura.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{collaborator ? "Guardar Cambios" : "Guardar Arquitecto"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function CollaboratorsListCard({ collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator }: { collaborators: Collaborator[], onAddCollaborator: (m: any) => void, onUpdateCollaborator: (m: any) => void, onDeleteCollaborator: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeCollaborator, setActiveCollaborator] = useState<Collaborator | undefined>(undefined);

    const handleEdit = (collaborator: Collaborator) => {
        setActiveCollaborator(collaborator);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveCollaborator(undefined);
        setFormOpen(true);
    }

    const handleSubmit = (values: any) => {
        if (activeCollaborator) {
            onUpdateCollaborator(values);
        } else {
            onAddCollaborator(values);
        }
    };


    return (
        <Card>
            <CollaboratorForm 
              collaborator={activeCollaborator} 
              onSubmit={handleSubmit} 
              open={isFormOpen} 
              onOpenChange={setFormOpen} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Arquitectos</CardTitle>
                    <CardDescription>Profesionales y empresas externas que colaboran en proyectos.</CardDescription>
                </div>
                 <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Arquitecto</Button>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                        {collaborators.map(collaborator => (
                            <TableRow key={collaborator.id}>
                                <TableCell className="font-medium">{collaborator.name}</TableCell>
                                <TableCell>{collaborator.role}</TableCell>
                                <TableCell>{collaborator.localidad}</TableCell>
                                <TableCell>{collaborator.phone}</TableCell>
                                <TableCell>{collaborator.email}</TableCell>
                                <TableCell>{collaborator.instagram}</TableCell>
                                <TableCell>{collaborator.web}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(collaborator)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al arquitecto.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteCollaborator(collaborator.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                         {collaborators.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No hay arquitectos añadidos.
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
