
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, MoreHorizontal, Pencil, Trash2, CornerUpLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";


const messageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacío."),
  senderId: z.string().min(1, "Debes seleccionar un remitente."),
  recipientId: z.string().optional(), // Can be optional for replies within a thread
  read: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
});

type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  recipientId?: string; // Optional for replies
  createdAt: any; // Firestore Timestamp
  read?: boolean;
  parentId?: string | null;
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
  initialData,
}: {
  message?: ChatMessage;
  team: TeamMember[];
  onSubmit: (values: any) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<z.infer<typeof messageSchema>>;
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
          read: message.read || false,
          parentId: message.parentId || null,
        });
      } else {
        form.reset({
          content: initialData?.content || "",
          senderId: initialData?.senderId || "",
          recipientId: initialData?.recipientId || "",
          read: false,
          parentId: initialData?.parentId || null,
        });
      }
    }
  }, [message, open, form, initialData]);

  const handleSubmit = (values: z.infer<typeof messageSchema>) => {
    onSubmit({ ...message, ...values, createdAt: new Date() });
    onOpenChange(false);
  };
  
  const isReply = !!form.watch('parentId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{message ? "Editar Mensaje" : (isReply ? "Responder al Hilo" : "Nuevo Mensaje")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!isReply && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="senderId" render={({ field }) => (
                  <FormItem><FormLabel>De:</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar remitente" /></SelectTrigger></FormControl><SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="recipientId" render={({ field }) => (
                  <FormItem><FormLabel>Para:</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar destinatario" /></SelectTrigger></FormControl><SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
            )}
             {isReply && (
                 <FormField control={form.control} name="senderId" render={({ field }) => (
                  <FormItem><FormLabel>Responder como:</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar remitente" /></SelectTrigger></FormControl><SelectContent>{team.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
            )}
            <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Mensaje</FormLabel><FormControl><Textarea placeholder="Escribe tu mensaje aquí..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
            )} />
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


function MessageItem({
    message,
    allMessages,
    team,
    level = 0,
    onReply,
    onEdit,
    onDelete,
    onToggleRead,
}: {
    message: ChatMessage;
    allMessages: ChatMessage[];
    team: TeamMember[];
    level?: number;
    onReply: (message: ChatMessage) => void;
    onEdit: (message: ChatMessage) => void;
    onDelete: (id: string) => void;
    onToggleRead: (message: ChatMessage) => void;
}) {
    const sender = team.find(m => m.id === message.senderId);
    const recipient = team.find(m => m.id === message.recipientId);
    const replies = allMessages.filter(m => m.parentId === message.id);

    return (
        <div style={{ marginLeft: `${level * 2}rem` }} className="mt-4">
             <div 
                className={cn("flex items-start gap-4 p-4 rounded-lg",
                    message.read ? "bg-secondary/50 hover:bg-secondary/70" : "bg-primary/10 hover:bg-primary/20 border border-primary/50"
                )}
            >
                <Avatar>
                    <AvatarImage src={sender?.avatar} />
                    <AvatarFallback>{sender?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">
                            {sender?.name}
                            {recipient && (
                                <>
                                <span className="text-sm font-normal text-muted-foreground mx-2">&rarr;</span>
                                {recipient?.name}
                                </>
                            )}
                        </p>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                             <p className="text-xs text-muted-foreground">
                                {message.createdAt?.toDate ? format(message.createdAt.toDate(), "d MMM, HH:mm", { locale: es }) : 'Enviando...'}
                            </p>
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => onReply(message)}><CornerUpLeft className="mr-2"/>Responder</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onEdit(message)}><Pencil className="mr-2"/>Editar</DropdownMenuItem>
                                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Eliminar</DropdownMenuItem></AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el mensaje permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(message.id)}>Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-2 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox id={`read-${message.id}`} checked={message.read} onCheckedChange={() => onToggleRead(message)} />
                        <label htmlFor={`read-${message.id}`} className="text-xs font-medium text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Marcar como leído
                        </label>
                    </div>
                </div>
            </div>
             {replies.length > 0 && (
                <div className="border-l-2 border-primary/20">
                    {replies.map(reply => (
                        <MessageItem
                            key={reply.id}
                            message={reply}
                            allMessages={allMessages}
                            team={team}
                            level={level + 1}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleRead={onToggleRead}
                        />
                    ))}
                </div>
            )}
        </div>
    )
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
  const [initialData, setInitialData] = useState<Partial<z.infer<typeof messageSchema>> | undefined>(undefined);

  const handleEdit = (message: ChatMessage) => {
    setActiveMessage(message);
    setInitialData(undefined);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setActiveMessage(undefined);
    setInitialData(undefined);
    setFormOpen(true);
  };
  
  const handleReply = (messageToReply: ChatMessage) => {
      const sender = team.find(m => m.id === messageToReply.senderId);
      const quotedText = `\n\n> En respuesta a ${sender?.name || 'un mensaje anterior'}:\n> "${messageToReply.content.substring(0, 80)}${messageToReply.content.length > 80 ? '...' : ''}"\n\n`;
      
      setActiveMessage(undefined);
      setInitialData({
          content: quotedText,
          parentId: messageToReply.parentId || messageToReply.id, // Reply to the thread
      });
      setFormOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (activeMessage) {
      onUpdateMessage(values);
    } else {
      onAddMessage(values);
    }
  };

  const handleToggleRead = (message: ChatMessage) => {
    onUpdateMessage({ ...message, read: !message.read });
  };
  
  const topLevelMessages = useMemo(() => {
      return messages.filter(m => !m.parentId).sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
  }, [messages]);

  return (
    <Card>
      <MessageForm
        message={activeMessage}
        team={team}
        onSubmit={handleSubmit}
        open={isFormOpen}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
              setActiveMessage(undefined);
              setInitialData(undefined);
            }
            setFormOpen(isOpen);
        }}
        initialData={initialData}
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
            {topLevelMessages.map(message => (
                <MessageItem
                    key={message.id}
                    message={message}
                    allMessages={messages}
                    team={team}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={onDeleteMessage}
                    onToggleRead={handleToggleRead}
                />
            ))}
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
