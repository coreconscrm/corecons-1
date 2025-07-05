"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck } from "lucide-react";

const providerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  contact: z.string().min(1, "El contacto es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  discount: z.string().min(1, "El descuento es requerido."),
});

export function ProviderList({ providers, onAddProvider }: { providers: any[], onAddProvider: (provider: any) => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: { name: "", contact: "", phone: "", discount: "" },
  });

  const onSubmit = (values: z.infer<typeof providerSchema>) => {
    onAddProvider(values);
    form.reset();
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>Gestiona los proveedores y sus acuerdos.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Truck className="mr-2 h-4 w-4" />
              Añadir Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proveedor</FormLabel>
                    <FormControl><Input placeholder="Cementos Fortaleza" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl><Input placeholder="Carlos Ruiz" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input placeholder="555-876-5432" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento Acordado</FormLabel>
                    <FormControl><Input placeholder="10%" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit">Guardar Proveedor</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Descuento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map(provider => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>{provider.contact}</TableCell>
                <TableCell>{provider.phone}</TableCell>
                <TableCell>{provider.discount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
