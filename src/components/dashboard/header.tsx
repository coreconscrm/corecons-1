
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut, SquarePen } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/use-auth";
import logo from '@/logo.png';

export function Header({ onPriceAssistantClick }: { onPriceAssistantClick: () => void }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast({ title: 'Sesión cerrada', description: 'Has salido de tu cuenta.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al cerrar sesión', description: (error as Error).message });
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src={logo} alt="WinnBuilders Logo" width={28} height={28} className="object-contain"/>
        <h1 className="text-lg font-bold text-foreground hidden sm:block">
          WinnBuilders CRM
        </h1>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPriceAssistantClick}>
          <SquarePen className="h-4 w-4" />
          <span className="sr-only">Asistente de Precios</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
}
