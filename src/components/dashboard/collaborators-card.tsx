
"use client"

import { useState } from "react";
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
  name: z.string().min(1, "El nombre es requerido."),
  role: z.string().min(1, "El rol es requerido."),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
});

export type Collaborator = z.infer<typeof collaboratorSchema> & { id: string };

function CollaboratorForm({ collaborator, onSubmit, open, onOpenChange }: { collaborator?: Collaborator, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof collaboratorSchema>>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: collaborator || { name: "", role: "", phone: "", email: "", instagram: "" },
    });
    
    const handleSubmit = async (values: z.infer<typeof collaboratorSchema>) => {
        onSubmit({ ...collaborator, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{collaborator ? "Editar Colaborador" : "Añadir Nuevo Colaborador"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ana Torres" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Arquitecto Técnico" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ana.t@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@ana_arquitectura" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{collaborator ? "Guardar Cambios" : "Guardar Colaborador"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function CollaboratorsListCard({ collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator }: { collaborators: Collaborator[], onAddCollaborator: (m: any) => void, onUpdateCollaborator: (m: any) => void, onDeleteCollaborator: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | undefined>(undefined);

    const handleEdit = (collaborator: Collaborator) => {
        setEditingCollaborator(collaborator);
    };

    const handleSubmit = (values: any) => {
        if (editingCollaborator) {
            onUpdateCollaborator(values);
        } else {
            onAddCollaborator(values);
        }
        setEditingCollaborator(undefined);
    };


    return (
        <Card>
            <CollaboratorForm 
              collaborator={editingCollaborator} 
              onSubmit={handleSubmit} 
              open={isAddDialogOpen || !!editingCollaborator} 
              onOpenChange={(open) => {
                if(!open) {
                  setAddDialogOpen(false);
                  setEditingCollaborator(undefined);
                } else {
                  setAddDialogOpen(true)
                }
              }} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Colaboradores</CardTitle>
                    <CardDescription>Profesionales y empresas externas que colaboran en proyectos.</CardDescription>
                </div>
                 <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir Colaborador</Button>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Instagram</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collaborators.map(collaborator => (
                            <TableRow key={collaborator.id}>
                                <TableCell className="font-medium">{collaborator.name}</TableCell>
                                <TableCell>{collaborator.role}</TableCell>
                                <TableCell>{collaborator.phone}</TableCell>
                                <TableCell>{collaborator.email}</TableCell>
                                <TableCell>{collaborator.instagram}</TableCell>
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
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al colaborador.</AlertDialogDescription></AlertDialogHeader>
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
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay colaboradores añadidos.
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
