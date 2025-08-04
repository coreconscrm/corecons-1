
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, PlusCircle, MoreHorizontal, Pencil, Trash2, Folder, ExternalLink } from "lucide-react";

// --- Schemas ---

const sectionSchema = z.object({
  name: z.string().min(1, "El nombre de la sección es requerido."),
});

const linkSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  url: z.string().url("Debe ser una URL válida."),
  sectionId: z.string().min(1, "Debes seleccionar una sección."),
});

// --- Types ---

type LinkSection = {
  id: string;
  name: string;
};

type CompanyLink = {
  id: string;
  title: string;
  url: string;
  sectionId: string;
};

// --- Dialogs ---

function SectionForm({ section, onSubmit, onOpenChange, open }: { section?: LinkSection, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: section?.name || "" },
  });

  const handleSubmit = (values: z.infer<typeof sectionSchema>) => {
    onSubmit({ ...section, ...values });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? "Editar Sección" : "Crear Nueva Sección"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Sección</FormLabel>
                  <FormControl><Input placeholder="Ej: Herramientas de Marketing" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{section ? "Guardar Cambios" : "Crear Sección"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({ link, sections, onSubmit, onOpenChange, open }: { link?: CompanyLink, sections: LinkSection[], onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: link?.title || "",
      url: link?.url || "",
      sectionId: link?.sectionId || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof linkSchema>) => {
    onSubmit({ ...link, ...values });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{link ? "Editar Enlace" : "Añadir Nuevo Enlace"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sección</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una sección" /></SelectTrigger></FormControl>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input placeholder="Ej: Google Analytics" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl><Input type="url" placeholder="https://analytics.google.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{link ? "Guardar Cambios" : "Guardar Enlace"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

export function LinksSection({
  links,
  sections,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
}: {
  links: CompanyLink[];
  sections: LinkSection[];
  onAddLink: (link: any) => void;
  onUpdateLink: (link: any) => void;
  onDeleteLink: (id: string) => void;
  onAddSection: (section: any) => void;
  onUpdateSection: (section: any) => void;
  onDeleteSection: (id: string) => void;
}) {
  const [isLinkFormOpen, setLinkFormOpen] = useState(false);
  const [isSectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CompanyLink | undefined>(undefined);
  const [editingSection, setEditingSection] = useState<LinkSection | undefined>(undefined);

  const groupedLinks = useMemo(() => {
    const groups: Record<string, CompanyLink[]> = {};
    sections.forEach(section => {
      groups[section.name] = links.filter(link => link.sectionId === section.id);
    });
    return groups;
  }, [links, sections]);

  const handleEditLink = (link: CompanyLink) => {
    setEditingLink(link);
    setLinkFormOpen(true);
  };

  const handleAddLink = () => {
    setEditingLink(undefined);
    setLinkFormOpen(true);
  };

  const handleEditSection = (section: LinkSection) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const handleAddSection = () => {
    setEditingSection(undefined);
    setSectionFormOpen(true);
  };

  return (
    <>
      <LinkForm link={editingLink} sections={sections} onSubmit={editingLink ? onUpdateLink : onAddLink} open={isLinkFormOpen} onOpenChange={setLinkFormOpen} />
      <SectionForm section={editingSection} onSubmit={editingSection ? onUpdateSection : onAddSection} open={isSectionFormOpen} onOpenChange={setSectionFormOpen} />
      
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Enlaces de Interés</CardTitle>
            <CardDescription>Gestiona los enlaces importantes para la empresa.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddSection}><Folder className="mr-2 h-4 w-4" />Crear Sección</Button>
            <Button onClick={handleAddLink} disabled={sections.length === 0}><Link2 className="mr-2 h-4 w-4" />Añadir Enlace</Button>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedLinks).map(([sectionName, linksInSection]) => {
                const section = sections.find(s => s.name === sectionName);
                if (!section) return null;

                return (
                  <div key={section.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><Folder size={20} /> {sectionName}</h3>
                      <AlertDialog>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onSelect={() => handleEditSection(section)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                  <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará la sección y todos los enlaces que contiene. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteSection(section.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {linksInSection.map(link => (
                                <TableRow key={link.id}>
                                    <TableCell className="font-medium">{link.title}</TableCell>
                                    <TableCell>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        {link.url} <ExternalLink size={14} />
                                      </a>
                                    </TableCell>
                                    <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEditLink(link)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el enlace.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteLink(link.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))}
                                {linksInSection.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                    No hay enlaces en esta sección.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No hay secciones creadas. Haz clic en "Crear Sección" para empezar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
