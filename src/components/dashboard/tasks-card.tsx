
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
import { ConstructorasListCard, type Constructora } from "./constructoras-card";
import { ReformistasListCard, type Reformista } from "./reformistas-card";
import { InmobiliariasListCard, type Inmobiliaria } from "./inmobiliarias-card";
import { PriceListCard } from "./prices-card";


const priceListItemSchema = z.object({
  description: z.string().optional(),
  unit: z.enum(["ud", "m", "pa", "m2", "m3"]).optional(),
  price: z.coerce.number().optional(),
});

const providerSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  discount: z.string().optional(),
  specialization: z.string().optional(),
  priceList: z.array(priceListItemSchema).optional(),
});

type Provider = z.infer<typeof providerSchema> & { id: string };

function ProviderForm({ provider, onSubmit, onOpenChange, open }: { provider?: Provider, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof providerSchema>>({
        resolver: zodResolver(providerSchema),
        defaultValues: { name: "", contact: "", phone: "", discount: "", specialization: "", priceList: [] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "priceList"
    });

    useEffect(() => {
        if (open) {
            if (provider) {
                form.reset({ 
                    ...provider,
                    name: provider.name || "",
                    contact: provider.contact || "",
                    phone: provider.phone || "",
                    discount: provider.discount || "",
                    specialization: provider.specialization || "",
                    priceList: provider.priceList || [] 
                });
            } else {
                form.reset({ name: "", contact: "", phone: "", discount: "", specialization: "", priceList: [] });
            }
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
                            <FormItem><FormLabel>Nombre del Proveedor</FormLabel><FormControl><Input placeholder="Cementos Fortaleza" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="contact" render={({ field }) => (
                            <FormItem><FormLabel>Persona de Contacto</FormLabel><FormControl><Input placeholder="Carlos Ruiz" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="555-876-5432" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="specialization" render={({ field }) => (
                            <FormItem><FormLabel>Especialidad</FormLabel><FormControl><Input placeholder="Estructuras, fontanería..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="discount" render={({ field }) => (
                            <FormItem><FormLabel>Descuento Acordado</FormLabel><FormControl><Input placeholder="10%" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState<Provider | undefined>(undefined);

    const handleEdit = (provider: Provider) => {
      setActiveProvider(provider);
      setFormOpen(true);
    };

    const handleAdd = () => {
      setActiveProvider(undefined);
      setFormOpen(true);
    };

    const handleSubmit = (values: any) => {
        if(activeProvider) {
            onUpdateProvider(values);
        } else {
            onAddProvider(values);
        }
    };

    return (
        <Card>
            <ProviderForm 
              provider={activeProvider} 
              onSubmit={handleSubmit} 
              open={isFormOpen} 
              onOpenChange={setFormOpen} 
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
    constructoras, onAddConstructora, onUpdateConstructora, onDeleteConstructora,
    reformistas, onAddReformista, onUpdateReformista, onDeleteReformista,
    inmobiliarias, onAddInmobiliaria, onUpdateInmobiliaria, onDeleteInmobiliaria,
    visibleTabs
}: {
    providers: Provider[], onAddProvider: (p: any) => void, onUpdateProvider: (p: any) => void, onDeleteProvider: (id: string) => void,
    collaborators: Collaborator[], onAddCollaborator: (c: any) => void, onUpdateCollaborator: (c: any) => void, onDeleteCollaborator: (id: string) => void,
    interioristas: Interiorista[], onAddInteriorista: (c: any) => void, onUpdateInteriorista: (c: any) => void, onDeleteInteriorista: (id: string) => void,
    constructoras: Constructora[], onAddConstructora: (c: any) => void, onUpdateConstructora: (c: any) => void, onDeleteConstructora: (id: string) => void,
    reformistas: Reformista[], onAddReformista: (c: any) => void, onUpdateReformista: (c: any) => void, onDeleteReformista: (id: string) => void,
    inmobiliarias: Inmobiliaria[], onAddInmobiliaria: (c: any) => void, onUpdateInmobiliaria: (c: any) => void, onDeleteInmobiliaria: (id: string) => void,
    visibleTabs: any
}) {
     const tabs = [
        { value: "providers", label: "Proveedores", visible: visibleTabs.providers },
        { value: "collaborators", label: "Arquitectos", visible: visibleTabs.collaborators },
        { value: "interioristas", label: "Interioristas", visible: visibleTabs.interioristas },
        { value: "constructoras", label: "Constructoras", visible: visibleTabs.constructoras },
        { value: "reformistas", label: "Reformistas", visible: visibleTabs.reformistas },
        { value: "inmobiliarias", label: "Inmobiliarias", visible: visibleTabs.inmobiliarias },
        { value: "prices", label: "Base de Precios", visible: visibleTabs.prices },
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        const savedTab = localStorage.getItem('providerSection_activeTab');
        if (savedTab && tabs.some(t => t.value === savedTab)) {
            setActiveTab(savedTab);
        } else if (tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [visibleTabs]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('providerSection_activeTab', value);
    };
    
    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)` }}>
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
             {visibleTabs.constructoras && (
              <TabsContent value="constructoras" className="mt-6">
                  <ConstructorasListCard 
                      constructoras={constructoras}
                      onAddConstructora={onAddConstructora}
                      onUpdateConstructora={onUpdateConstructora}
                      onDeleteConstructora={onDeleteConstructora}
                  />
              </TabsContent>
            )}
             {visibleTabs.reformistas && (
              <TabsContent value="reformistas" className="mt-6">
                  <ReformistasListCard 
                      reformistas={reformistas}
                      onAddReformista={onAddReformista}
                      onUpdateReformista={onUpdateReformista}
                      onDeleteReformista={onDeleteReformista}
                  />
              </TabsContent>
            )}
            {visibleTabs.inmobiliarias && (
              <TabsContent value="inmobiliarias" className="mt-6">
                  <InmobiliariasListCard 
                      inmobiliarias={inmobiliarias}
                      onAddInmobiliaria={onAddInmobiliaria}
                      onUpdateInmobiliaria={onUpdateInmobiliaria}
                      onDeleteInmobiliaria={onDeleteInmobiliaria}
                  />
              </TabsContent>
            )}
            {visibleTabs.prices && (
              <TabsContent value="prices" className="mt-6">
                  <PriceListCard providers={providers} />
              </TabsContent>
            )}
        </Tabs>
    )
}
