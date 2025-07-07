"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, MoreHorizontal, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const companySchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  address: z.string().min(1, "La dirección es requerida."),
  cif: z.string().min(1, "El CIF es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  email: z.string().email("Email inválido."),
  web: z.string().url("URL de web inválida.").or(z.literal('')),
  logo: z.string().url("URL de logo inválida.").optional().or(z.literal('')),
  validity: z.string().min(1, "La validez es requerida."),
  paymentMethods: z.string().min(1, "Las formas de pago son requeridas."),
});

export type Company = z.infer<typeof companySchema> & { id: string };

function CompanyForm({ company, onSubmit, onOpenChange, open }: { company?: Company, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: company || { name: "", address: "", cif: "", phone: "", email: "", web: "", logo: "", validity: "Validez del presupuesto: 30 días.", paymentMethods: "Precios indicados sin IVA. El pago se realizará 50% al inicio y 50% a la finalización." },
    });
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(company?.logo || null);
    const { toast } = useToast();

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    const handleSubmit = async (values: z.infer<typeof companySchema>) => {
        setIsUploading(true);
        const companyId = company?.id || `comp-${Date.now()}`;
        let submissionData = { ...values, id: companyId };

        try {
            if (logoFile) {
                const storageRef = ref(storage, `companies/${companyId}/logo/${logoFile.name}`);
                const snapshot = await uploadBytesResumable(storageRef, logoFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                submissionData.logo = downloadURL;
            }

            onSubmit({ ...company, ...submissionData });
            form.reset();
            setLogoFile(null);
            setPreviewUrl(null);
            onOpenChange(false);

        } catch (error) {
             console.error("Error processing form: ", error);
             toast({ variant: 'destructive', title: "Error al guardar", description: `No se pudo guardar la empresa. Error: ${(error as Error).message}` });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setLogoFile(null);
                setPreviewUrl(company?.logo || null);
            }
            onOpenChange(isOpen);
        }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{company ? "Editar Empresa" : "Añadir Nueva Empresa"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="WinnBuilders" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="cif" render={({ field }) => (
                                <FormItem><FormLabel>CIF</FormLabel><FormControl><Input placeholder="B-12345678" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Parque Tecnológico de Barcelona, C/ Marie Curie, 8" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+34 930 000 000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="info@winnbuilders.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="https://www.winnbuilders.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>Logo de la Empresa</FormLabel>
                            <div className="flex items-center gap-4">
                                {previewUrl && <Image src={previewUrl} alt="Vista previa del logo" width={100} height={40} className="object-contain rounded border p-1" data-ai-hint="logo" />}
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={handleLogoChange} className="flex-1" />
                                </FormControl>
                            </div>
                        </FormItem>
                        <FormField control={form.control} name="validity" render={({ field }) => (
                            <FormItem><FormLabel>Validez del Presupuesto</FormLabel><FormControl><Textarea placeholder="Validez del presupuesto: 30 días." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="paymentMethods" render={({ field }) => (
                            <FormItem><FormLabel>Formas de Pago</FormLabel><FormControl><Textarea placeholder="Precios indicados sin IVA. El pago se realizará 50% al inicio y 50% a la finalización." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {company ? "Guardar Cambios" : "Guardar Empresa"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function CompanyListCard({ companies, onAddCompany, onUpdateCompany, onDeleteCompany }: { companies: Company[], onAddCompany: (company: any) => void, onUpdateCompany: (company: any) => void, onDeleteCompany: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined);

    return (
        <Card>
            {editingCompany && <CompanyForm company={editingCompany} onSubmit={onUpdateCompany} open={!!editingCompany} onOpenChange={() => setEditingCompany(undefined)} />}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Empresas</CardTitle>
                        <CardDescription>Gestiona los perfiles de empresa para emitir presupuestos.</CardDescription>
                    </div>
                    <DialogTrigger asChild>
                        <Button><Building className="mr-2 h-4 w-4" />Añadir Empresa</Button>
                    </DialogTrigger>
                </CardHeader>
                <CompanyForm onSubmit={onAddCompany} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
            </Dialog>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>CIF</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map(company => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.cif}</TableCell>
                                <TableCell>{company.email}</TableCell>
                                <TableCell>{company.phone}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => setEditingCompany(company)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil de la empresa.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteCompany(company.id)}>Eliminar</AlertDialogAction>
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
