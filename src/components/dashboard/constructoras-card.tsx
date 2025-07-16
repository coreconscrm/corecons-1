
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


const constructoraSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
});

export type Constructora = z.infer<typeof constructoraSchema> & { id: string };

function ConstructoraForm({ constructora, onSubmit, open, onOpenChange }: { constructora?: Constructora, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof constructoraSchema>>({
        resolver: zodResolver(constructoraSchema),
        defaultValues: { name: "", role: "Constructora", localidad: "", phone: "", email: "", instagram: "", web: "" },
    });
    
    useEffect(() => {
        if(open) {
            if(constructora) {
                form.reset({
                    name: constructora.name || "",
                    role: constructora.role || "",
                    localidad: constructora.localidad || "",
                    phone: constructora.phone || "",
                    email: constructora.email || "",
                    instagram: constructora.instagram || "",
                    web: constructora.web || "",
                });
            } else {
                form.reset({ name: "", role: "Constructora", localidad: "", phone: "", email: "", instagram: "", web: "" });
            }
        }
    }, [constructora, open, form]);

    const handleSubmit = async (values: z.infer<typeof constructoraSchema>) => {
        onSubmit({ ...constructora, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{constructora ? "Editar Constructora" : "Añadir Nueva Constructora"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Construcciones S.A." {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Edificación residencial" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="localidad" render={({ field }) => (
                            <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Madrid" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-456" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contacto@construcciones.com" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="instagram" render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@construcciones" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.construcciones.com" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{constructora ? "Guardar Cambios" : "Guardar Constructora"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ConstructorasListCard({ constructoras, onAddConstructora, onUpdateConstructora, onDeleteConstructora }: { constructoras: Constructora[], onAddConstructora: (m: any) => void, onUpdateConstructora: (m: any) => void, onDeleteConstructora: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingConstructora, setEditingConstructora] = useState<Constructora | undefined>(undefined);

    const handleEdit = (constructora: Constructora) => {
        setEditingConstructora(constructora);
    };

    const handleSubmit = (values: any) => {
        if (editingConstructora) {
            onUpdateConstructora(values);
        } else {
            onAddConstructora(values);
        }
        setEditingConstructora(undefined);
    };

    return (
        <Card>
            <ConstructoraForm 
              constructora={editingConstructora} 
              onSubmit={handleSubmit} 
              open={isAddDialogOpen || !!editingConstructora} 
              onOpenChange={(open) => {
                if(!open) {
                  setAddDialogOpen(false);
                  setEditingConstructora(undefined);
                } else {
                  setEditingConstructora(undefined)
                  setAddDialogOpen(true)
                }
              }} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Constructoras</CardTitle>
                    <CardDescription>Empresas constructoras que colaboran en proyectos.</CardDescription>
                </div>
                 <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir Constructora</Button>
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
                        {constructoras.map(constructora => (
                            <TableRow key={constructora.id}>
                                <TableCell className="font-medium">{constructora.name}</TableCell>
                                <TableCell>{constructora.role}</TableCell>
                                <TableCell>{constructora.localidad}</TableCell>
                                <TableCell>{constructora.phone}</TableCell>
                                <TableCell>{constructora.email}</TableCell>
                                <TableCell>{constructora.instagram}</TableCell>
                                <TableCell>{constructora.web}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(constructora)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la constructora.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteConstructora(constructora.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                         {constructoras.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No hay constructoras añadidas.
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
