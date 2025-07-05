"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, CalendarDays, Camera, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const projectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido."),
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  budget: z.coerce.number().min(0, "El presupuesto debe ser un número positivo."),
  status: z.string().min(1, "El estado es requerido."),
});

const uploadSchema = z.object({
    file: z.any().refine((files) => files?.length === 1, 'Se requiere un archivo.'),
});


export function ProjectList({ projects, clients, onAddProject }: { projects: any[], clients: any[], onAddProject: (project: any) => void }) {
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", clientId: "", budget: 0, status: "Planificado" },
  });

  const uploadForm = useForm({
      resolver: zodResolver(uploadSchema),
  });

  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    onAddProject(values);
    form.reset();
    setOpen(false);
  };
  
  const onUploadSubmit = (values: z.infer<typeof uploadSchema>) => {
    console.log('Uploading file:', values.file[0].name);
    // Aquí se gestionaría la subida del archivo
    setUploadDialogOpen(false);
    uploadForm.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Proyectos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto</FormLabel>
                    <FormControl><Input placeholder="Residencial Los Robles" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un cliente" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto (€)</FormLabel>
                    <FormControl><Input type="number" placeholder="500000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planificado">Planificado</SelectItem>
                        <SelectItem value="En progreso">En progreso</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit">Guardar Proyecto</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{clients.find(c => c.id === project.clientId)?.name}</CardDescription>
                  </div>
                  <Badge variant={project.status === 'Completado' ? 'default' : 'secondary'}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               <div>
                <h4 className="font-semibold text-sm mb-2">Presupuesto</h4>
                <p>€{project.budget.toLocaleString('es-ES')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Documentación</h4>
                {project.documentation.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {project.documentation.map((doc:any) => <li key={doc.name}><a href={doc.url} className="text-primary hover:underline">{doc.name}</a></li>)}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No hay documentos.</p>
                )}
              </div>
               <div>
                <h4 className="font-semibold text-sm mb-2">Fotos del Proyecto</h4>
                 {project.photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {project.photos.map((photo: string, index: number) => (
                           <Image key={index} src={photo} alt={`${project.name} photo ${index + 1}`} width={100} height={100} className="rounded-md object-cover" data-ai-hint="construction building" />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No hay fotos.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-3 gap-2">
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><FileText className="mr-1 h-4 w-4" /> Docs</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Subir Documentación</DialogTitle>
                    </DialogHeader>
                     <Form {...uploadForm}>
                        <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                           <FormField control={uploadForm.control} name="file" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Archivo</FormLabel>
                                    <FormControl>
                                        <Input type="file" onChange={(e) => field.onChange(e.target.files)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                           )} />
                           <DialogFooter>
                                <Button type="submit"><Upload className="mr-2 h-4 w-4" /> Subir</Button>
                           </DialogFooter>
                        </form>
                     </Form>
                  </DialogContent>
                </Dialog>
              <Button variant="outline" size="sm"><CalendarDays className="mr-1 h-4 w-4" /> Plan</Button>
              <Button variant="outline" size="sm"><Camera className="mr-1 h-4 w-4" /> Fotos</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
