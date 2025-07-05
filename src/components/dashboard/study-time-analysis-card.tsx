"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const teamMemberSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  role: z.string().min(1, "El rol es requerido."),
  avatar: z.string().url("URL de avatar inválida").optional().or(z.literal('')),
});

type TeamMember = z.infer<typeof teamMemberSchema> & { id: string, hint?: string };

function TeamMemberForm({ member, onSubmit, open, onOpenChange }: { member?: TeamMember, onSubmit: (values: any) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof teamMemberSchema>>({
        resolver: zodResolver(teamMemberSchema),
        defaultValues: member ? { ...member, avatar: member.avatar || '' } : { name: "", role: "", avatar: "" },
    });

    const handleSubmit = (values: z.infer<typeof teamMemberSchema>) => {
        const avatar = values.avatar || 'https://placehold.co/40x40.png';
        onSubmit({ ...member, ...values, avatar, hint: 'person portrait' });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{member ? "Editar Miembro" : "Añadir Nuevo Miembro"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Elena García" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Rol</FormLabel><FormControl><Input placeholder="Jefa de Proyecto" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="avatar" render={({ field }) => (
                            <FormItem><FormLabel>URL del Avatar (Opcional)</FormLabel><FormControl><Input placeholder="https://placehold.co/40x40.png" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">{member ? "Guardar Cambios" : "Guardar Miembro"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function TeamListCard({ team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember }: { team: TeamMember[], onAddTeamMember: (m: any) => void, onUpdateTeamMember: (m: any) => void, onDeleteTeamMember: (id: string) => void }) {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);

    return (
        <Card>
            {editingMember && <TeamMemberForm member={editingMember} onSubmit={onUpdateTeamMember} open={!!editingMember} onOpenChange={() => setEditingMember(undefined)} />}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Equipo de Administración</CardTitle>
                        <CardDescription>Personal clave en la gestión de WinnBuilders.</CardDescription>
                    </div>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2" /> Añadir Miembro</Button>
                    </DialogTrigger>
                </CardHeader>
                <TeamMemberForm onSubmit={onAddTeamMember} open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
            </Dialog>
            <CardContent className="space-y-2 pt-4">
                {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-secondary">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.avatar} alt={member.name} data-ai-hint={member.hint} />
                                <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        </div>
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => setEditingMember(member)}><Pencil className="mr-2" />Editar</DropdownMenuItem>
                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2" />Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al miembro del equipo.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteTeamMember(member.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
