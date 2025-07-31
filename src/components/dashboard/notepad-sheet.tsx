
"use client";

import { useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

export function NotepadSheet({
  open,
  onOpenChange,
  content,
  onContentChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onContentChange: (content: string) => void;
}) {
  const { toast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      triggerRef.current.click();
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado al portapapeles",
      description: "Tus notas han sido copiadas.",
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };
  
  const handleClose = () => {
      if(closeRef.current) {
          closeRef.current.click();
      }
  }

  return (
    <Sheet onOpenChange={handleOpenChange} modal={false}>
      <SheetTrigger ref={triggerRef} className="hidden" />
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Bloc de Notas Temporal</SheetTitle>
          <SheetDescription>
            Tus notas se guardarán durante la sesión. Se borrarán al recargar
            la página.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-4">
          <Textarea
            placeholder="Escribe tus notas aquí..."
            className="h-full resize-none"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
          />
        </div>
        <SheetFooter>
            <SheetClose ref={closeRef} className="hidden" />
            <Button variant="outline" onClick={handleCopy} disabled={!content}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar todo
            </Button>
             <Button variant="secondary" onClick={handleClose}>
                Cerrar
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
