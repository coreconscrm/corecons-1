import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Building2, User, Settings } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

export function Header({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold text-foreground hidden sm:block">
          WinnBuilders CRM
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettingsClick}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configuración</span>
        </Button>
        <ThemeToggle />
        <Avatar className="h-9 w-9">
          <AvatarImage
            src="https://placehold.co/40x40.png"
            alt="User"
            data-ai-hint="person portrait"
          />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
