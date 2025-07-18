
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


const interioristaSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  localidad: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  web: z.string().optional(),
});

export type Interiorista = z.infer<typeof interioristaSchema> & { id: string };

function InterioristaForm({ interiorista, onSubmit, open, onOpenChange }: { interiorista?: Interiorista, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof interioristaSchema>>({
        resolver: zodResolver(interioristaSchema),
        defaultValues: { name: "", role: "", localidad: "", phone: "", email: "", instagram: "", web: "" },
    });
    
     useEffect(() => {
        if(open) {
            if(interiorista) {
                form.reset({
                    name: interiorista.name || "",
                    role: interiorista.role || "",
                    localidad: interiorista.localidad || "",
                    phone: interiorista.phone || "",
                    email: interiorista.email || "",
                    instagram: interiorista.instagram || "",
                    web: interiorista.web || "",
                });
            } else {
                form.reset({ name: "", role: "", localidad: "", phone: "", email: "", instagram: "", web: "" });
            }
        }
    }, [interiorista, open, form]);

    const handleSubmit = async (values: z.infer<typeof interioristaSchema>) => {
        onSubmit({ ...interiorista, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{interiorista ? "Editar Interiorista" : "Añadir Nuevo Interiorista"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ana Torres" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol / Especialidad</FormLabel><FormControl><Input placeholder="Diseño de interiores" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@ana_diseno" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="www.anadiseno.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{interiorista ? "Guardar Cambios" : "Guardar Interiorista"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function InterioristasListCard({ interioristas, onAddInteriorista, onUpdateInteriorista, onDeleteInteriorista }: { interioristas: Interiorista[], onAddInteriorista: (m: any) => void, onUpdateInteriorista: (m: any) => void, onDeleteInteriorista: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeInteriorista, setActiveInteriorista] = useState<Interiorista | undefined>(undefined);

    const handleEdit = (interiorista: Interiorista) => {
        setActiveInteriorista(interiorista);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveInteriorista(undefined);
        setFormOpen(true);
    };

    const handleSubmit = (values: any) => {
        if (activeInteriorista) {
            onUpdateInteriorista(values);
        } else {
            onAddInteriorista(values);
        }
    };


    return (
        <Card>
            <InterioristaForm 
              interiorista={activeInteriorista} 
              onSubmit={handleSubmit} 
              open={isFormOpen} 
              onOpenChange={setFormOpen} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Interioristas</CardTitle>
                    <CardDescription>Profesionales y empresas externas de diseño de interiores.</CardDescription>
                </div>
                 <Button onClick={handleAdd}><UserPlus className="mr-2 h-4 w-4" />Añadir Interiorista</Button>
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
                        {interioristas.map(interiorista => (
                            <TableRow key={interiorista.id}>
                                <TableCell className="font-medium">{interiorista.name}</TableCell>
                                <TableCell>{interiorista.role}</TableCell>
                                <TableCell>{interiorista.localidad}</TableCell>
                                <TableCell>{interiorista.phone}</TableCell>
                                <TableCell>{interiorista.email}</TableCell>
                                <TableCell>{interiorista.instagram}</TableCell>
                                <TableCell>{interiorista.web}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(interiorista)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al interiorista.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteInteriorista(interiorista.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                         {interioristas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No hay interioristas añadidos.
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
