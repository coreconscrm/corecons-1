
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const messageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacío."),
  senderId: z.string().min(1, "Debes seleccionar un remitente."),
  recipientId: z.string().min(1, "Debes seleccionar un destinatario."),
});

type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: any; // Firestore Timestamp
};

type TeamMember = {
  id: string;
  name: string;
  avatar?: string;
};

function MessageForm({
  message,
  team,
  onSubmit,
  open,
  onOpenChange,
}: {
  message?: ChatMessage;
  team: TeamMember[];
  onSubmit: (values: any) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  useEffect(() => {
    if (open) {
      if (message) {
        form.reset({
          content: message.content,
          senderId: message.senderId,
          recipientId: message.recipientId,
        });
      } else {
        form.reset({
          content: "",
          senderId: "",
          recipientId: "",
        });
      }
    }
  }, [message, open, form]);

  const handleSubmit = (values: z.infer<typeof messageSchema>) => {
    onSubmit({ ...message, ...values, createdAt: new Date() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{message ? "Editar Mensaje" : "Nuevo Mensaje"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>De:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar remitente" /></SelectTrigger></FormControl>
                      <SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar destinatario" /></SelectTrigger></FormControl>
                      <SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Escribe tu mensaje aquí..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">{message ? "Guardar Cambios" : "Enviar Mensaje"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ChatSection({
  messages,
  team,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
}: {
  messages: ChatMessage[];
  team: TeamMember[];
  onAddMessage: (message: any) => void;
  onUpdateMessage: (message: any) => void;
  onDeleteMessage: (id: string) => void;
}) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | undefined>(undefined);

  const handleEdit = (message: ChatMessage) => {
    setActiveMessage(message);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setActiveMessage(undefined);
    setFormOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (activeMessage) {
      onUpdateMessage(values);
    } else {
      onAddMessage(values);
    }
  };

  const getTeamMember = (id: string) => {
    return team.find(m => m.id === id);
  }

  return (
    <Card>
      <MessageForm
        message={activeMessage}
        team={team}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={setFormOpen}
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare /> Chat Interno
          </div>
          <Button onClick={handleAdd}><Send className="mr-2 h-4 w-4" /> Nuevo Mensaje</Button>
        </CardTitle>
        <CardDescription>
          Un espacio para la comunicación directa entre los miembros del equipo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length > 0 ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {messages.map(message => {
                const sender = getTeamMember(message.senderId);
                const recipient = getTeamMember(message.recipientId);

                return (
                    <div key={message.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                        <Avatar>
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback>{sender?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">
                                    {sender?.name}
                                    <span className="text-sm font-normal text-muted-foreground mx-2">&rarr;</span>
                                    {recipient?.name}
                                </p>
                                <div className="flex items-center gap-2">
                                     <p className="text-xs text-muted-foreground">
                                        {message.createdAt?.toDate ? format(message.createdAt.toDate(), "d MMM, HH:mm", { locale: es }) : 'Enviando...'}
                                    </p>
                                    <AlertDialog>
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleEdit(message)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el mensaje permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteMessage(message.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay mensajes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Haz clic en "Nuevo Mensaje" para iniciar una conversación.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
