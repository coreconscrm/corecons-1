
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
    LayoutGrid,
    Users,
    Building,
    Briefcase,
    FileText,
    Settings,
    Home,
    Handshake,
    PenSquare,
    UsersRound,
    Building2,
    Wrench,
    Warehouse,
    Bot,
    GanttChartSquare,
    Library,
    FileCode,
    Sheet,
    Calculator
} from 'lucide-react';
import logo from '@/logo.png';

// Menú de navegación original y estático
const navItems = [
    { id: "oficina", label: "Oficina", icon: Warehouse },
    { id: "seguimiento", label: "Seguimiento", icon: GanttChartSquare },
    { id: "ia", label: "IA", icon: Bot },
    { id: "projects", label: "Proyectos", icon: Home },
    { id: "reformas", label: "Reformas", icon: Wrench },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "budgets", label: "Presupuestos", icon: FileText },
    { id: "companies", label: "Empresas", icon: Building2 },
    { id: "providers", label: "Proveedores", icon: Building },
    { id: "collaborators", label: "Colaboradores", icon: Handshake },
    { id: "interioristas", label: "Interioristas", icon: PenSquare },
    { id: "constructoras", label: "Constructoras", icon: Briefcase },
    { id: "reformistas", label: "Reformistas", icon: UsersRound },
    { id: "inmobiliarias", label: "Inmobiliarias", icon: Building },
    { id: "estimaciones", label: "Estimaciones", icon: Calculator },
    { id: "protocols", label: "Protocolos", icon: Library },
    { id: "disk", label: "Disco", icon: FileCode },
    { id: "forms", label: "Formularios", icon: Sheet },
];

function DashboardSidebar() {
  const { activeTab, setActiveTab } = useDashboard();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2">
            <Image src={logo} alt="WinnBuilders Logo" width={32} height={32} className="object-contain" />
            <span className="text-lg font-semibold text-foreground">WinnBuilders</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* Botón fijo para el Panel de Control */}
          <SidebarMenuItem onClick={() => setActiveTab("panel")}>
              <SidebarMenuButton
                isActive={activeTab === "panel"}
                icon={<LayoutGrid className="h-5 w-5" />}
              >
                Panel de Control
              </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Resto del menú original */}
          {navItems.map((item) => (
            <SidebarMenuItem key={item.id} onClick={() => setActiveTab(item.id)}>
              <SidebarMenuButton
                isActive={activeTab === item.id}
                icon={<item.icon className="h-5 w-5" />}
              >
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </DashboardProvider>
  );
}
