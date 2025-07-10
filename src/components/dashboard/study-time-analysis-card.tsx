
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
import { UserPlus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


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

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(member?.avatar || null);
    const { toast } = useToast();

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    const handleSubmit = async (values: z.infer<typeof teamMemberSchema>) => {
        setIsUploading(true);
        const memberId = member?.id || `team-${Date.now()}`;
        let submissionData = { ...values, id: memberId, hint: 'person portrait' };

        try {
            if (avatarFile) {
                const storageRef = ref(storage, `team/${memberId}/avatar/${avatarFile.name}`);
                const snapshot = await uploadBytesResumable(storageRef, avatarFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                submissionData.avatar = downloadURL;
            } else if (!submissionData.avatar) {
                 submissionData.avatar = 'https://placehold.co/40x40.png';
            }

            onSubmit({ ...member, ...submissionData });
            form.reset();
            setAvatarFile(null);
            setPreviewUrl(null);
            onOpenChange(false);
        } catch (error) {
            console.error("Error processing form: ", error);
            toast({ variant: 'destructive', title: "Error al guardar", description: `No se pudo guardar el miembro. Error: ${(error as Error).message}` });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setAvatarFile(null);
                setPreviewUrl(member?.avatar || null);
            }
            onOpenChange(isOpen);
        }}>
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
                        <FormItem>
                            <FormLabel>Avatar</FormLabel>
                            <div className="flex items-center gap-4">
                                {previewUrl && <Avatar><AvatarImage src={previewUrl} data-ai-hint="person portrait" /><AvatarFallback>{form.getValues("name")?.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>}
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={handleAvatarChange} className="flex-1" />
                                </FormControl>
                            </div>
                        </FormItem>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {member ? "Guardar Cambios" : "Guardar Miembro"}
                            </Button>
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
                 {team.length === 0 && (
                     <div className="text-center text-muted-foreground py-8">
                        No hay miembros del equipo añadidos.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
