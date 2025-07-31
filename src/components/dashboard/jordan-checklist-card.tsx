
"use client"

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChecks, PlusCircle, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";


const checklistItemSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío."),
  completed: z.boolean(),
});

const checklistSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  items: z.array(checklistItemSchema),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type Checklist = z.infer<typeof checklistSchema> & { id: string };

function ChecklistForm({ checklist, onSubmit, open, onOpenChange }: { checklist?: Checklist, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof checklistSchema>>({
        resolver: zodResolver(checklistSchema),
        defaultValues: { title: "", items: [{ text: "", completed: false }] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    useEffect(() => {
        if (open) {
            if (checklist) {
                form.reset({
                    title: checklist.title,
                    items: checklist.items.length > 0 ? checklist.items : [{ text: "", completed: false }],
                });
            } else {
                form.reset({
                    title: "",
                    items: [{ text: "", completed: false }],
                });
            }
        }
    }, [checklist, open, form]);

    const handleSubmit = (values: z.infer<typeof checklistSchema>) => {
        onSubmit({ ...checklist, ...values });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{checklist ? "Editar Checklist" : "Nueva Checklist"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título de la Checklist</FormLabel>
                                    <FormControl><Input placeholder="Ej: Preparación para entrega de obra" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <FormField control={form.control} name={`items.${index}.completed`} render={({ field }) => (
                                        <FormItem><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name={`items.${index}.text`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input placeholder="Nueva tarea..." {...field} /></FormControl></FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "", completed: false })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tarea
                        </Button>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{checklist ? "Guardar Cambios" : "Guardar Checklist"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function JordanChecklistCard({ checklists, onAddChecklist, onUpdateChecklist, onDeleteChecklist }: { checklists: Checklist[], onAddChecklist: (c: any) => void, onUpdateChecklist: (c: any) => void, onDeleteChecklist: (id: string) => void }) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [activeChecklist, setActiveChecklist] = useState<Checklist | undefined>(undefined);

    const handleEdit = (checklist: Checklist) => {
        setActiveChecklist(checklist);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setActiveChecklist(undefined);
        setFormOpen(true);
    };

    const handleSubmit = (values: any) => {
        if (activeChecklist) {
            onUpdateChecklist(values);
        } else {
            onAddChecklist(values);
        }
    };

    const handleToggleItem = (checklist: Checklist, itemIndex: number) => {
        const newItems = [...checklist.items];
        newItems[itemIndex] = { ...newItems[itemIndex], completed: !newItems[itemIndex].completed };
        onUpdateChecklist({ ...checklist, items: newItems });
    };

    const calculateProgress = (items: ChecklistItem[] = []) => {
        if (items.length === 0) return 0;
        const completedCount = items.filter(item => item.completed).length;
        return (completedCount / items.length) * 100;
    };

    return (
        <Card>
            <ChecklistForm
                checklist={activeChecklist}
                onSubmit={handleSubmit}
                open={isFormOpen}
                onOpenChange={setFormOpen}
            />
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><ListChecks /> Checklist de Jordan</CardTitle>
                    <CardDescription>Crea y gestiona listas de tareas para mantener todo bajo control.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Crear Checklist</Button>
            </CardHeader>
            <CardContent>
                {checklists.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {checklists.map(checklist => (
                            <AccordionItem value={checklist.id} key={checklist.id} className="border rounded-md px-4">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-semibold text-lg">{checklist.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Progress value={calculateProgress(checklist.items)} className="w-1/3 h-2" />
                                            <span className="text-sm text-muted-foreground">
                                                {checklist.items.filter(i => i.completed).length} de {checklist.items.length} completadas
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 mb-4">
                                        {checklist.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50">
                                                <Checkbox id={`item-${checklist.id}-${index}`} checked={item.completed} onCheckedChange={() => handleToggleItem(checklist, index)} />
                                                <label htmlFor={`item-${checklist.id}-${index}`} className={cn("flex-1 text-sm cursor-pointer", item.completed && "line-through text-muted-foreground")}>{item.text}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(checklist)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la checklist "{checklist.title}" y todas sus tareas.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteChecklist(checklist.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <CheckCircle2 className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">Todo en orden</h3>
                        <p className="mt-1 text-sm">No hay checklists. ¡Crea una para empezar!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
