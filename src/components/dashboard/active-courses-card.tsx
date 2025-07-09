"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  contact: z.string().min(1, "El nombre de contacto es requerido."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  origin: z.enum(["Email", "Recomendado", "Formulario", "Redes", "Otros"], {
    required_error: "Debe seleccionar un origen."
  })
});

type Client = z.infer<typeof clientSchema> & { id: string };

function ClientForm({ client, onSubmit, onOpenChange, open }: { client?: Client, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || { name: "", contact: "", email: "", phone: "", origin: "Formulario" },
  });

  useEffect(() => {
    if (client) {
      form.reset(client);
    } else {
      form.reset({ name: "", contact: "", email: "", phone: "", origin: "Formulario" });
    }
  }, [client, form]);

  const handleSubmit = (values: z.infer<typeof clientSchema>) => {
    onSubmit({ ...client, ...values });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Añadir Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Proyecto de reforma" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="contact" render={({ field }) => (
              <FormItem><FormLabel>Persona de Contacto</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="origin" render={({ field }) => (
              <FormItem>
                <FormLabel>Origen del Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un origen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Recomendado">Recomendado</SelectItem>
                    <SelectItem value="Formulario">Formulario</SelectItem>
                    <SelectItem value="Redes">Redes</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{client ? "Guardar Cambios" : "Guardar Cliente"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientListCard({ clients, onAddClient, onUpdateClient, onDeleteClient, providers }: { clients: Client[], onAddClient: (client: any) => void, onUpdateClient: (client: any) => void, onDeleteClient: (id: string) => void, providers: any[] }) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  return (
    <Card>
      {editingClient && <ClientForm client={editingClient} onSubmit={onUpdateClient} open={!!editingClient} onOpenChange={() => setEditingClient(undefined)} />}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gestiona tus clientes y potenciales clientes.</CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" />Añadir Cliente</Button>
          </DialogTrigger>
        </CardHeader>
        <ClientForm onSubmit={onAddClient} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
      </Dialog>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.origin}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setEditingClient(client)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                          <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteClient(client.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
