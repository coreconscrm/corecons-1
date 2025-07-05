"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const providerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  contact: z.string().min(1, "El contacto es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  discount: z.string().min(1, "El descuento es requerido."),
  specialization: z.string().min(1, "La especialidad es requerida."),
});

type Provider = z.infer<typeof providerSchema> & { id: string };

function ProviderForm({ provider, onSubmit, onOpenChange, open }: { provider?: Provider, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof providerSchema>>({
        resolver: zodResolver(providerSchema),
        defaultValues: provider || { name: "", contact: "", phone: "", discount: "", specialization: "" },
    });

    const handleSubmit = (values: z.infer<typeof providerSchema>) => {
        onSubmit({ ...provider, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{provider ? "Editar Proveedor" : "Añadir Nuevo Proveedor"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Proveedor</FormLabel><FormControl><Input placeholder="Cementos Fortaleza" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="contact" render={({ field }) => (
                            <FormItem><FormLabel>Persona de Contacto</FormLabel><FormControl><Input placeholder="Carlos Ruiz" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-876-5432" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="specialization" render={({ field }) => (
                            <FormItem><FormLabel>Especialidad</FormLabel><FormControl><Input placeholder="Estructuras, fontanería..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="discount" render={({ field }) => (
                            <FormItem><FormLabel>Descuento Acordado</FormLabel><FormControl><Input placeholder="10%" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{provider ? "Guardar Cambios" : "Guardar Proveedor"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ProviderListCard({ providers, onAddProvider, onUpdateProvider, onDeleteProvider }: { providers: Provider[], onAddProvider: (provider: any) => void, onUpdateProvider: (provider: any) => void, onDeleteProvider: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);

    return (
        <Card>
            {editingProvider && <ProviderForm provider={editingProvider} onSubmit={onUpdateProvider} open={!!editingProvider} onOpenChange={() => setEditingProvider(undefined)} />}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Proveedores</CardTitle>
                        <CardDescription>Gestiona los proveedores y sus acuerdos.</CardDescription>
                    </div>
                    <DialogTrigger asChild>
                        <Button><Truck className="mr-2 h-4 w-4" />Añadir Proveedor</Button>
                    </DialogTrigger>
                </CardHeader>
                <ProviderForm onSubmit={onAddProvider} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
            </Dialog>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Descuento</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {providers.map(provider => (
                            <TableRow key={provider.id}>
                                <TableCell className="font-medium">{provider.name}</TableCell>
                                <TableCell>{provider.specialization}</TableCell>
                                <TableCell>{provider.contact}</TableCell>
                                <TableCell>{provider.phone}</TableCell>
                                <TableCell>{provider.discount}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => setEditingProvider(provider)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el proveedor.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteProvider(provider.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
