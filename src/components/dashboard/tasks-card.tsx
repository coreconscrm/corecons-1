
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Truck, MoreHorizontal, Pencil, Trash2, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollaboratorsListCard, type Collaborator } from "./collaborators-card";
import { InterioristasListCard, type Interiorista } from "./interioristas-card";


const priceListItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida."),
  unit: z.enum(["ud", "m", "pa", "m2", "m3"]),
  price: z.coerce.number().min(0, "El precio debe ser un número positivo."),
});

const providerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  contact: z.string().min(1, "El contacto es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  discount: z.string().min(1, "El descuento es requerido."),
  specialization: z.string().min(1, "La especialidad es requerida."),
  priceList: z.array(priceListItemSchema).optional(),
});

type Provider = z.infer<typeof providerSchema> & { id: string };

function ProviderForm({ provider, onSubmit, onOpenChange, open }: { provider?: Provider, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof providerSchema>>({
        resolver: zodResolver(providerSchema),
        defaultValues: provider || { name: "", contact: "", phone: "", discount: "", specialization: "", priceList: [] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "priceList"
    });

    useEffect(() => {
        if (open) {
            form.reset(provider ? { ...provider, priceList: provider.priceList || [] } : { name: "", contact: "", phone: "", discount: "", specialization: "", priceList: [] });
        }
    }, [provider, open, form]);

    const handleSubmit = (values: z.infer<typeof providerSchema>) => {
        onSubmit({ ...provider, ...values });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{provider ? "Editar Proveedor" : "Añadir Nuevo Proveedor"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
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
                        
                        <Card>
                            <CardHeader><CardTitle>Base de Precios</CardTitle><CardDescription>Añade los productos o servicios que ofrece este proveedor.</CardDescription></CardHeader>
                            <CardContent>
                                <div className="w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[250px]">Descripción</TableHead>
                                                <TableHead className="w-[120px]">Unidad</TableHead>
                                                <TableHead className="w-[120px]">Precio/Ud.</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <FormField control={form.control} name={`priceList.${index}.description`} render={({ field }) => <Input {...field} placeholder="Saco de cemento cola" />} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField control={form.control} name={`priceList.${index}.unit`} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ud">ud</SelectItem>
                                                                <SelectItem value="m">m</SelectItem>
                                                                <SelectItem value="m2">m2</SelectItem>
                                                                <SelectItem value="m3">m3</SelectItem>
                                                                <SelectItem value="pa">pa</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        )} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField control={form.control} name={`priceList.${index}.price`} render={({ field }) => <Input type="number" {...field} />} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: "", unit: "ud", price: 0 })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Precio
                                </Button>
                            </CardContent>
                        </Card>

                        <DialogFooter className="pt-4 mt-auto border-t">
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

    const handleEdit = (provider: Provider) => {
      setEditingProvider(provider);
    };

    const handleAdd = () => {
      setEditingProvider(undefined);
      setAddDialogOpen(true);
    };

    const handleSubmit = (values: any) => {
        if(editingProvider) {
            onUpdateProvider(values);
        } else {
            onAddProvider(values);
        }
        setEditingProvider(undefined);
    };

    return (
        <Card>
            <ProviderForm 
              provider={editingProvider} 
              onSubmit={handleSubmit} 
              open={isAddDialogOpen || !!editingProvider} 
              onOpenChange={(open) => {
                if(!open) {
                  setAddDialogOpen(false);
                  setEditingProvider(undefined);
                } else {
                  setAddDialogOpen(true)
                }
              }} 
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Proveedores</CardTitle>
                    <CardDescription>Gestiona los proveedores y sus acuerdos.</CardDescription>
                </div>
                 <Button onClick={handleAdd}><Truck className="mr-2 h-4 w-4" />Añadir Proveedor</Button>
            </CardHeader>
            
            <CardContent>
              <div className="w-full overflow-x-auto">
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
                                                <DropdownMenuItem onSelect={() => handleEdit(provider)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
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
              </div>
            </CardContent>
        </Card>
    );
}

export function ProviderSection({
    providers, onAddProvider, onUpdateProvider, onDeleteProvider,
    collaborators, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator,
    interioristas, onAddInteriorista, onUpdateInteriorista, onDeleteInteriorista,
    visibleTabs
}: {
    providers: Provider[], onAddProvider: (p: any) => void, onUpdateProvider: (p: any) => void, onDeleteProvider: (id: string) => void,
    collaborators: Collaborator[], onAddCollaborator: (c: any) => void, onUpdateCollaborator: (c: any) => void, onDeleteCollaborator: (id: string) => void,
    interioristas: Interiorista[], onAddInteriorista: (c: any) => void, onUpdateInteriorista: (c: any) => void, onDeleteInteriorista: (id: string) => void,
    visibleTabs: any
}) {
     const tabs = [
        { value: "providers", label: "Proveedores", visible: visibleTabs.providers },
        { value: "collaborators", label: "Arquitectos", visible: visibleTabs.collaborators },
        { value: "interioristas", label: "Interioristas", visible: visibleTabs.interioristas }
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    
    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
            </TabsList>
            {visibleTabs.providers && (
              <TabsContent value="providers" className="mt-6">
                  <ProviderListCard 
                      providers={providers}
                      onAddProvider={onAddProvider}
                      onUpdateProvider={onUpdateProvider}
                      onDeleteProvider={onDeleteProvider}
                  />
              </TabsContent>
            )}
            {visibleTabs.collaborators && (
              <TabsContent value="collaborators" className="mt-6">
                  <CollaboratorsListCard 
                      collaborators={collaborators}
                      onAddCollaborator={onAddCollaborator}
                      onUpdateCollaborator={onUpdateCollaborator}
                      onDeleteCollaborator={onDeleteCollaborator}
                  />
              </TabsContent>
            )}
            {visibleTabs.interioristas && (
              <TabsContent value="interioristas" className="mt-6">
                  <InterioristasListCard 
                      interioristas={interioristas}
                      onAddInteriorista={onAddInteriorista}
                      onUpdateInteriorista={onUpdateInteriorista}
                      onDeleteInteriorista={onDeleteInteriorista}
                  />
              </TabsContent>
            )}
        </Tabs>
    )
}
