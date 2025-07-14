
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


const reformistaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  role: z.string().min(1, "El rol es requerido."),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
});

export type Reformista = z.infer<typeof reformistaSchema> & { id: string };

function ReformistaForm({ reformista, onSubmit, open, onOpenChange }: { reformista?: Reformista, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof reformistaSchema>>({
        resolver: zodResolver(reformistaSchema),
        defaultValues: reformista || { name: "", role: "Reformista", localidad: "", phone: "", email: "", instagram: "", web: "" },
    });
    
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
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Reformas Integrales" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Reformas de baños y cocinas" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="localidad" render={({ field }) => (
                            <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Valencia" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contacto@reformas.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@reformas" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.reformas.com" {...field} /></FormControl><FormMessage /></FormItem>
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
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingReformista, setEditingReformista] = useState<Reformista | undefined>(undefined);

    const handleEdit = (reformista: Reformista) => {
        setEditingReformista(reformista);
    };

    const handleSubmit = (values: any) => {
        if (editingReformista) {
            onUpdateReformista(values);
        } else {
            onAddReformista(values);
        }
        setEditingReformista(undefined);
    };

    return (
        <Card>
            <ReformistaForm 
              reformista={editingReformista} 
              onSubmit={handleSubmit} 
              open={isAddDialogOpen || !!editingReformista} 
              onOpenChange={(open) => {
                if(!open) {
                  setAddDialogOpen(false);
                  setEditingReformista(undefined);
                } else {
                  setAddDialogOpen(true)
                }
              }} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Reformistas</CardTitle>
                    <CardDescription>Empresas reformistas que colaboran en proyectos.</CardDescription>
                </div>
                 <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir Reformista</Button>
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
                        {reformistas.map(reformista => (
                            <TableRow key={reformista.id}>
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
                        ))}
                         {reformistas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No hay reformistas añadidos.
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
