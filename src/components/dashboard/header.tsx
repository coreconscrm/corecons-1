
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useToast } from '@/hooks/use-toast';
import logo from '@/logo.png';

export function Header() {
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src={logo} alt="WinnBuilders Logo" width={28} height={28} className="object-contain"/>
        <h1 className="text-base font-bold text-foreground hidden sm:block">
          WinnBuilders CRM
        </h1>
      </Link>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
