
"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsCard, type Document } from "./documents-card";
import { TeamListCard } from "./study-time-analysis-card";


const companySchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  cif: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  web: z.string().url("URL de web inválida.").optional().or(z.literal('')),
  logo: z.string().url("URL de logo inválida.").optional().or(z.literal('')),
  validity: z.string().optional(),
  paymentMethods: z.string().optional(),
});

export type Company = z.infer<typeof companySchema> & { id: string };

function CompanyForm({ company, onSubmit, onOpenChange, open }: { company?: Company, onSubmit: (values: any) => Promise<void>, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: { name: "", address: "", cif: "", phone: "", email: "", web: "", logo: "", validity: "Validez del presupuesto: 30 días.", paymentMethods: "Precios indicados sin IVA. El pago se realizará 50% al inicio y 50% a la finalización." },
    });
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (open) {
            if (company) {
                form.reset(company);
                setPreviewUrl(company.logo || null);
            } else {
                form.reset({ name: "", address: "", cif: "", phone: "", email: "", web: "", logo: "", validity: "Validez del presupuesto: 30 días.", paymentMethods: "Precios indicados sin IVA. El pago se realizará 50% al inicio y 50% a la finalización." });
                setPreviewUrl(null);
            }
             setLogoFile(null); // Reset file on open
        }
    }, [company, open, form]);

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
            } else {
                submissionData.logo = company?.logo || "";
            }

            await onSubmit({ ...company, ...submissionData });
            onOpenChange(false);

        } catch (error) {
             console.error("Error processing form: ", error);
             toast({ variant: 'destructive', title: "Error al guardar", description: `No se pudo guardar la empresa. Error: ${(error as Error).message}` });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{company ? "Editar Empresa" : "Añadir Nueva Empresa"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto pr-6 -mr-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="WinnBuilders" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="cif" render={({ field }) => (
                                <FormItem><FormLabel>CIF</FormLabel><FormControl><Input placeholder="B-12345678" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Parque Tecnológico de Barcelona, C/ Marie Curie, 8" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+34 930 000 000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="info@winnbuilders.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="web" render={({ field }) => (
                            <FormItem><FormLabel>Página Web</FormLabel><FormControl><Input placeholder="https://www.winnbuilders.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                            <FormItem><FormLabel>Validez del Presupuesto</FormLabel><FormControl><Textarea placeholder="Validez del presupuesto: 30 días." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="paymentMethods" render={({ field }) => (
                            <FormItem><FormLabel>Formas de Pago</FormLabel><FormControl><Textarea placeholder="Precios indicados sin IVA. El pago se realizará 50% al inicio y 50% a la finalización." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background">
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

function CompanyProfilesCard({ companies, onAddCompany, onUpdateCompany, onDeleteCompany }: { companies: Company[], onAddCompany: (company: any) => Promise<void>, onUpdateCompany: (company: any) => Promise<void>, onDeleteCompany: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeCompany, setActiveCompany] = useState<Company | undefined>(undefined);
    
    const handleEdit = (company: Company) => {
        setActiveCompany(company);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveCompany(undefined);
        setFormOpen(true);
    };
    
    const handleSubmit = async (values: any) => {
        if(activeCompany) {
            await onUpdateCompany(values);
        } else {
            await onAddCompany(values);
        }
    }

    return (
        <Card>
            <CompanyForm company={activeCompany} onSubmit={handleSubmit} open={isFormOpen} onOpenChange={setFormOpen} />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Perfiles de Empresa</CardTitle>
                    <CardDescription>Gestiona los perfiles de empresa para emitir presupuestos.</CardDescription>
                </div>
                <Button onClick={handleAdd}><Building className="mr-2 h-4 w-4" />Añadir Empresa</Button>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
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
                                                <DropdownMenuItem onSelect={() => handleEdit(company)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
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
              </div>
            </CardContent>
        </Card>
    );
}

export function CompanySection({
    companies, onAddCompany, onUpdateCompany, onDeleteCompany,
    documents, onAddDocument, onDeleteDocument,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    visibleTabs
}: {
    companies: Company[], onAddCompany: (c: any) => Promise<void>, onUpdateCompany: (c: any) => Promise<void>, onDeleteCompany: (id: string) => Promise<void>,
    documents: Document[], onAddDocument: (d: any) => void, onDeleteDocument: (id: string) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    visibleTabs: any
}) {
    const tabs = [
        { value: "profiles", label: "Perfiles de Empresa", visible: visibleTabs.companies },
        { value: "documents", label: "Documentos Generales", visible: visibleTabs.companies },
        { value: "team", label: "Equipo", visible: visibleTabs.team },
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        const savedTab = localStorage.getItem('companySection_activeTab');
        if (savedTab && tabs.some(t => t.value === savedTab)) {
            setActiveTab(savedTab);
        } else if (tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [visibleTabs]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('companySection_activeTab', value);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)`}}>
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
            {visibleTabs.companies && (
                <TabsContent value="profiles" className="mt-6">
                    <CompanyProfilesCard 
                        companies={companies}
                        onAddCompany={onAddCompany}
                        onUpdateCompany={onUpdateCompany}
                        onDeleteCompany={onDeleteCompany}
                    />
                </TabsContent>
            )}
            {visibleTabs.companies && (
                <TabsContent value="documents" className="mt-6">
                    <DocumentsCard 
                        documents={documents}
                        onAddDocument={onAddDocument}
                        onDeleteDocument={onDeleteDocument}
                    />
                </TabsContent>
            )}
            {visibleTabs.team && (
                 <TabsContent value="team" className="mt-6">
                    <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
                </TabsContent>
            )}
        </Tabs>
    )
}

    