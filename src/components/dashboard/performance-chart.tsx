"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, CalendarDays, Camera, Upload, MoreVertical, Pencil, Trash2, XIcon, TrendingUp, Wallet, HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

// Schemas
const projectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido."),
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  budget: z.coerce.number().min(0, "El presupuesto debe ser un número positivo."),
  status: z.string().min(1, "El estado es requerido."),
  providerIds: z.array(z.string()).optional(),
  costs: z.record(z.string(), z.coerce.number().min(0, "El coste debe ser positivo").optional()).optional(),
});
const uploadSchema = z.object({ file: z.any().refine((files) => files?.length === 1, 'Se requiere un archivo.') });
const ganttTaskSchema = z.object({ name: z.string().min(1, "Nombre de tarea requerido"), days: z.coerce.number().min(1, "Duración debe ser al menos 1 día") });

// Tipos
type Project = {
    id: string;
    name: string;
    clientId: string;
    budget: number;
    status: string;
    documentation: any[];
    photos: string[];
    ganttData: any[];
    assignedProviders: { id: string; cost: number }[];
};


// --- Sub-componentes de Diálogos ---

function GanttChartDialog({ project, onSave, open, onOpenChange }: { project: Project, onSave: (p: Project) => void, open: boolean, onOpenChange: (o: boolean) => void }) {
    const [tasks, setTasks] = useState(project.ganttData || []);
    const form = useForm({ resolver: zodResolver(ganttTaskSchema), defaultValues: { name: "", days: 1 }});

    const addTask = (values: z.infer<typeof ganttTaskSchema>) => {
        setTasks([...tasks, values]);
        form.reset();
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave({ ...project, ganttData: tasks });
        onOpenChange(false);
    };

    const chartData = useMemo(() => {
        let accumulatedDays = 0;
        return tasks.map(task => {
            const range = [accumulatedDays, accumulatedDays + task.days];
            accumulatedDays += task.days;
            return { name: task.name, range };
        });
    }, [tasks]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>Planificación del Proyecto: {project.name}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-2">Diagrama de Gantt</h3>
                        {tasks.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip formatter={(value: any, name: any, props: any) => `${props.payload.range[1] - props.payload.range[0]} días`} />
                                    <Bar dataKey="range[1]" stackId="a" fill="hsl(var(--primary))" name="Días" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm">Añade tareas para ver el diagrama.</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Tareas</h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(addTask)} className="flex gap-2 mb-4">
                                <FormField control={form.control} name="name" render={({ field }) => <FormItem className="flex-grow"><FormControl><Input placeholder="Nombre de tarea" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="days" render={({ field }) => <FormItem><FormControl><Input type="number" className="w-20" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <Button type="submit" size="sm">Añadir</Button>
                            </form>
                        </Form>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {tasks.map((task, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-muted p-2 rounded-md">
                                    <span>{task.name} ({task.days} días)</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTask(i)}><XIcon size={14} /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Planificación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PhotoManagerDialog({ project, onSave, open, onOpenChange }: { project: Project, onSave: (p: Project) => void, open: boolean, onOpenChange: (o: boolean) => void }) {
    const [photos, setPhotos] = useState(project.photos || []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handlePhotoUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({ variant: 'destructive', title: "Archivo demasiado grande", description: "Por favor, sube imágenes de menos de 4MB." });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prevPhotos => [...prevPhotos, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };
    
    const handleSave = () => {
        onSave({ ...project, photos });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Fotos del Proyecto: {project.name}</DialogTitle></DialogHeader>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
                    {photos.map((photo, i) => (
                        <div key={i} className="relative group">
                            <Image src={photo} alt={`Foto ${i+1}`} width={200} height={200} className="rounded-md object-cover aspect-square" data-ai-hint="construction building" />
                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removePhoto(i)}><Trash2 size={14}/></Button>
                        </div>
                    ))}
                     <button onClick={handlePhotoUpload} className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:bg-muted aspect-square">
                        <Camera className="h-8 w-8" />
                        <span>Subir Foto</span>
                    </button>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary" className="mr-2">Cerrar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Fotos</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ProjectForm({ project, clients, providers, onSubmit, open, onOpenChange }: { project?: Project, clients: any[], providers: any[], onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    
    const form = useForm<z.infer<typeof projectSchema>>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            clientId: "",
            budget: 0,
            status: "Planificado",
            providerIds: [],
            costs: {}
        },
    });

    useEffect(() => {
        if (project && open) { // Check for `open` ensures this runs only when dialog becomes visible
            const costs = project.assignedProviders.reduce((acc, p) => ({ ...acc, [p.id]: p.cost }), {});
            const providerIds = project.assignedProviders.map(p => p.id);
            form.reset({ ...project, providerIds, costs });
        } else if (!project) { // Reset for new project form
            form.reset({
                name: "",
                clientId: "",
                budget: 0,
                status: "Planificado",
                providerIds: [],
                costs: {}
            });
        }
    }, [project, open, form]);
    
     const watchedProviderIds = useWatch({ control: form.control, name: 'providerIds', defaultValue: [] });
    
    const handleSubmit = (values: z.infer<typeof projectSchema>) => {
        const assignedProviders = (values.providerIds || []).map(id => ({
            id,
            cost: values.costs?.[id] || 0
        }));
        
        const finalProject = { ...(project || {}), ...values, assignedProviders, id: project?.id || `pro-${Date.now()}`};
        delete (finalProject as any).providerIds;
        delete (finalProject as any).costs;

        onSubmit(finalProject);
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Proyecto</FormLabel><FormControl><Input placeholder="Residencial Los Robles" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="clientId" render={({ field }) => (
                                <FormItem><FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger></FormControl>
                                        <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel>Estado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Planificado">Planificado</SelectItem>
                                            <SelectItem value="En progreso">En progreso</SelectItem>
                                            <SelectItem value="Completado">Completado</SelectItem>
                                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="budget" render={({ field }) => (
                            <FormItem><FormLabel>Presupuesto (€)</FormLabel><FormControl><Input type="number" placeholder="500000" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField
                            control={form.control}
                            name="providerIds"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Proveedores y Costes</FormLabel>
                                    <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-4">
                                    {providers.map((provider) => (
                                        <div key={provider.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                            <FormField
                                                control={form.control}
                                                name="providerIds"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 w-full sm:w-auto">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(provider.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                    ? field.onChange([...(field.value || []), provider.id])
                                                                    : field.onChange(field.value?.filter((value) => value !== provider.id));
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal w-48 truncate" title={provider.name}>
                                                            {provider.name}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            {watchedProviderIds?.includes(provider.id) && (
                                                <FormField
                                                    control={form.control}
                                                    name={`costs.${provider.id}`}
                                                    defaultValue={0}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-grow w-full sm:w-auto">
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                                                                    <Input type="number" placeholder="Coste" {...field} className="pl-6" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{project ? 'Guardar Cambios' : 'Guardar Proyecto'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


// --- Componente Principal ---

export function ProjectListCard({ projects, clients, providers, onAddProject, onUpdateProject, onDeleteProject }: { projects: Project[], clients: any[], providers: any[], onAddProject: (p: any) => void, onUpdateProject: (p: any) => void, onDeleteProject: (id: string) => void }) {
    const [isAddProjectOpen, setAddProjectOpen] = useState(false);
    const [activeDialog, setActiveDialog] = useState<{type: 'edit'|'docs'|'plan'|'photos'|null, project: Project|null}>({type: null, project: null});
    const { toast } = useToast();
    
    const openEditDialog = (project: Project) => {
        setActiveDialog({ type: 'edit', project });
    };
    
    const handleUpdate = (project: Project) => {
        onUpdateProject(project);
        closeDialogs();
    };
    
    const closeDialogs = () => setActiveDialog({type: null, project: null});

    const uploadForm = useForm({ resolver: zodResolver(uploadSchema) });
    const handleDocUpload = (values: z.infer<typeof uploadSchema>) => {
        if (!activeDialog.project || !values.file?.[0]) return;
        
        const file = values.file[0];
        const newDoc = { name: file.name, url: '#' }; // Simulación de subida
        const updatedProject = {
            ...activeDialog.project,
            documentation: [...activeDialog.project.documentation, newDoc],
        };

        onUpdateProject(updatedProject);
        toast({ title: "Documento subido", description: `El archivo ${newDoc.name} ha sido añadido.` });
        closeDialogs();
        uploadForm.reset();
    };


    return (
        <div>
            {/* Diálogos */}
            <ProjectForm project={activeDialog.type === 'edit' ? activeDialog.project! : undefined} clients={clients} providers={providers} onSubmit={activeDialog.type === 'edit' ? handleUpdate : onAddProject} open={activeDialog.type === 'edit'} onOpenChange={(isOpen) => !isOpen && closeDialogs()} />
            <ProjectForm clients={clients} providers={providers} onSubmit={onAddProject} open={isAddProjectOpen} onOpenChange={setAddProjectOpen} />
            {activeDialog.type === 'plan' && activeDialog.project && <GanttChartDialog project={activeDialog.project} onSave={onUpdateProject} open={true} onOpenChange={closeDialogs} />}
            {activeDialog.type === 'photos' && activeDialog.project && <PhotoManagerDialog project={activeDialog.project} onSave={onUpdateProject} open={true} onOpenChange={closeDialogs} />}
            
            <Dialog open={activeDialog.type === 'docs'} onOpenChange={(isOpen) => !isOpen && closeDialogs()}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Subir Documentación para {activeDialog.project?.name}</DialogTitle></DialogHeader>
                    <Form {...uploadForm}>
                        <form onSubmit={uploadForm.handleSubmit(handleDocUpload)} className="space-y-4">
                            <FormField control={uploadForm.control} name="file" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Archivo</FormLabel><FormControl><Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                                <Button type="submit"><Upload className="mr-2 h-4 w-4" /> Subir Archivo</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>


            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 mt-12 lg:mt-0">
                <h2 className="text-2xl font-bold">Proyectos</h2>
                <Button onClick={() => setAddProjectOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Añadir Proyecto</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(project => {
                    const totalProviderCost = project.assignedProviders.reduce((sum, p) => sum + p.cost, 0);
                    const margin = project.budget - totalProviderCost;
                    const progress = project.budget > 0 ? (totalProviderCost / project.budget) * 100 : 0;

                    return (
                        <Card key={project.id} className="flex flex-col shadow-md border-border/50">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="mb-1">{project.name}</CardTitle>
                                        <CardDescription>{clients.find(c => c.id === project.clientId)?.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <Badge variant={project.status === 'Completado' ? 'default' : (project.status === 'En progreso' ? 'secondary' : 'outline')}>{project.status}</Badge>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => openEditDialog(project)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto y todos sus datos.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteProject(project.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Resumen Financiero</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Wallet/> Presupuesto</span> <span className="font-mono">€{project.budget.toLocaleString('es-ES')}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><HandCoins/> Gasto Proveedores</span> <span className="font-mono text-destructive">-€{totalProviderCost.toLocaleString('es-ES')}</span></div>
                                        <div className="flex justify-between items-center border-t pt-2 mt-1"><span className="text-muted-foreground flex items-center gap-2"><TrendingUp/> Margen</span> <span className={`font-mono font-bold ${margin >= 0 ? 'text-primary' : 'text-destructive'}`}>€{margin.toLocaleString('es-ES')}</span></div>
                                        <Progress value={progress} className="h-2 mt-2" />
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-sm mb-2">Proveedores Asignados</h4>
                                    {project.assignedProviders && project.assignedProviders.length > 0 ? (
                                        <div className="space-y-1">
                                            {project.assignedProviders.map(ap => {
                                                const provider = providers.find(p => p.id === ap.id);
                                                return provider ? (
                                                    <div key={ap.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">{provider.name}</span>
                                                        <span className="font-mono">€{ap.cost.toLocaleString('es-ES')}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground">Ninguno asignado.</p>}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Documentación</h4>
                                    {project.documentation.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-muted-foreground">{project.documentation.map((doc: any, i: number) => <li key={i}><a href={doc.url} className="text-primary hover:underline">{doc.name}</a></li>)}</ul>
                                    ) : <p className="text-sm text-muted-foreground">No hay documentos.</p>}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Fotos del Proyecto</h4>
                                    {project.photos.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">{project.photos.slice(0,3).map((photo: string, index: number) => (<Image key={index} src={photo} alt={`${project.name} foto ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" data-ai-hint="construction building" />))}</div>
                                    ) : <p className="text-sm text-muted-foreground">No hay fotos.</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setActiveDialog({type: 'docs', project})}><FileText className="mr-1 h-4 w-4" /> Docs</Button>
                                <Button variant="outline" size="sm" onClick={() => setActiveDialog({type: 'plan', project})}><CalendarDays className="mr-1 h-4 w-4" /> Plan</Button>
                                <Button variant="outline" size="sm" onClick={() => setActiveDialog({type: 'photos', project})}><Camera className="mr-1 h-4 w-4" /> Fotos</Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
