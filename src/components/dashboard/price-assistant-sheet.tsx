
"use client";

import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Sparkles, User, Bot } from "lucide-react";
import { getConstructionPrice } from '@/ai/flows/get-construction-price';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';


type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function PriceAssistantSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);
  
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
        const result = await getConstructionPrice({ query: input });
        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        const errorMessage: Message = { role: 'assistant', content: "Lo siento, ha ocurrido un error al contactar con la IA. Por favor, inténtalo de nuevo." };
        setMessages(prev => [...prev, errorMessage]);
        toast({
            variant: "destructive",
            title: "Error de IA",
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/> Asistente de Precios IA
          </SheetTitle>
          <SheetDescription>
            Consulta precios de materiales y partidas de obra.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 my-4 pr-4 -mr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                         {msg.role === 'assistant' && (
                             <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                 <AvatarFallback><Bot size={18}/></AvatarFallback>
                             </Avatar>
                         )}
                         <div className={cn(
                             "p-3 rounded-lg max-w-xs sm:max-w-sm whitespace-pre-wrap",
                             msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                         )}>
                            {msg.content}
                         </div>
                         {msg.role === 'user' && (
                             <Avatar className="h-8 w-8">
                                <AvatarFallback><User size={18} /></AvatarFallback>
                             </Avatar>
                         )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                             <AvatarFallback><Bot size={18}/></AvatarFallback>
                         </Avatar>
                        <div className="p-3 rounded-lg bg-secondary">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                 )}
            </div>
        </ScrollArea>
        <SheetFooter>
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
                <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Precio m² de alicatado..."
                    className="resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
