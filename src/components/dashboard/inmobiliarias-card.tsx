
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


const inmobiliariaSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
});

export type Inmobiliaria = z.infer<typeof inmobiliariaSchema> & { id: string };

function InmobiliariaForm({ inmobiliaria, onSubmit, open, onOpenChange }: { inmobiliaria?: Inmobiliaria, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof inmobiliariaSchema>>({
        resolver: zodResolver(inmobiliariaSchema),
        defaultValues: { name: "", role: "Inmobiliaria", localidad: "", phone: "", email: "", instagram: "", web: "" },
    });
    
     useEffect(() => {
        if(open) {
            if(inmobiliaria) {
                form.reset({
                    name: inmobiliaria.name || "",
                    role: inmobiliaria.role || "",
                    localidad: inmobiliaria.localidad || "",
                    phone: inmobiliaria.phone || "",
                    email: inmobiliaria.email || "",
                    instagram: inmobiliaria.instagram || "",
                    web: inmobiliaria.web || "",
                });
            } else {
                form.reset({ name: "", role: "Inmobiliaria", localidad: "", phone: "", email: "", instagram: "", web: "" });
            }
        }
    }, [inmobiliaria, open, form]);

    const handleSubmit = async (values: z.infer<typeof inmobiliariaSchema>) => {
        onSubmit({ ...inmobiliaria, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{inmobiliaria ? "Editar Inmobiliaria" : "Añadir Nueva Inmobiliaria"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Inmobiliaria Central" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Venta de propiedades" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="localidad" render={({ field }) => (
                            <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Valencia" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contacto@inmobiliaria.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@inmobiliaria" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.inmobiliaria.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{inmobiliaria ? "Guardar Cambios" : "Guardar Inmobiliaria"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function InmobiliariasListCard({ inmobiliarias, onAddInmobiliaria, onUpdateInmobiliaria, onDeleteInmobiliaria }: { inmobiliarias: Inmobiliaria[], onAddInmobiliaria: (m: any) => void, onUpdateInmobiliaria: (m: any) => void, onDeleteInmobiliaria: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingInmobiliaria, setEditingInmobiliaria] = useState<Inmobiliaria | undefined>(undefined);

    const handleEdit = (inmobiliaria: Inmobiliaria) => {
        setEditingInmobiliaria(inmobiliaria);
    };

    const handleSubmit = (values: any) => {
        if (editingInmobiliaria) {
            onUpdateInmobiliaria(values);
        } else {
            onAddInmobiliaria(values);
        }
        setEditingInmobiliaria(undefined);
    };

    return (
        <Card>
            <InmobiliariaForm 
              inmobiliaria={editingInmobiliaria} 
              onSubmit={handleSubmit} 
              open={isAddDialogOpen || !!editingInmobiliaria} 
              onOpenChange={(open) => {
                if(!open) {
                  setAddDialogOpen(false);
                  setEditingInmobiliaria(undefined);
                } else {
                  setEditingInmobiliaria(undefined)
                  setAddDialogOpen(true)
                }
              }} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Inmobiliarias</CardTitle>
                    <CardDescription>Empresas inmobiliarias que colaboran en proyectos.</CardDescription>
                </div>
                 <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir Inmobiliaria</Button>
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
                        {inmobiliarias.map(inmobiliaria => (
                            <TableRow key={inmobiliaria.id}>
                                <TableCell className="font-medium">{inmobiliaria.name}</TableCell>
                                <TableCell>{inmobiliaria.role}</TableCell>
                                <TableCell>{inmobiliaria.localidad}</TableCell>
                                <TableCell>{inmobiliaria.phone}</TableCell>
                                <TableCell>{inmobiliaria.email}</TableCell>
                                <TableCell>{inmobiliaria.instagram}</TableCell>
                                <TableCell>{inmobiliaria.web}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(inmobiliaria)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la inmobiliaria.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteInmobiliaria(inmobiliaria.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                         {inmobiliarias.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No hay inmobiliarias añadidas.
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
