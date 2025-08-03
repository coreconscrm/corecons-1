
"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Folder, File, MoreVertical, FolderUp, Upload, Trash2, ChevronRight, Home, FolderPlus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type DiskItem = {
    name: string;
    type: 'folder' | 'file';
    path: string;
    url?: string;
    fileType?: string;
};

const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-12 w-12" />;
    if (fileType.startsWith('image/')) return <File className="h-12 w-12 text-green-500" />;
    if (fileType === 'application/pdf') return <File className="h-12 w-12 text-red-500" />;
    if (fileType.includes('document')) return <File className="h-12 w-12 text-blue-500" />;
    return <File className="h-12 w-12" />;
};

function CreateFolderDialog({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (name: string) => void }) {
    const [name, setName] = useState("");
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                </DialogHeader>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la carpeta" />
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => { onCreate(name); onOpenChange(false); setName(""); }}>Crear</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DiskSection({ items, onUploadFile, onCreateFolder, onDeleteItem }: { items: DiskItem[], onUploadFile: (path: string, file: File) => Promise<void>, onCreateFolder: (path: string, folderName: string) => Promise<void>, onDeleteItem: (path: string, type: 'file' | 'folder') => Promise<void> }) {
    const [currentPath, setCurrentPath] = useState("disco/");
    const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const parentPath = item.path.substring(0, item.path.lastIndexOf('/') + 1);
            return parentPath === currentPath;
        });
    }, [items, currentPath]);

    const breadcrumbs = useMemo(() => {
        const parts = currentPath.split('/').filter(Boolean);
        const crumbs = [{ name: 'Disco', path: 'disco/' }];
        let path = 'disco/';
        for (const part of parts) {
            if (part === 'disco') continue;
            path += `${part}/`;
            crumbs.push({ name: part, path });
        }
        return crumbs;
    }, [currentPath]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        try {
            await onUploadFile(currentPath, file);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: `No se pudo subir el archivo. ${(error as Error).message}` });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateFolder = async (name: string) => {
        if (!name) return;
        setIsLoading(true);
        try {
            await onCreateFolder(currentPath, name);
        } catch (error) {
             toast({ variant: "destructive", title: "Error", description: `No se pudo crear la carpeta. ${(error as Error).message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (item: DiskItem) => {
        setIsLoading(true);
        try {
            await onDeleteItem(item.path, item.type);
        } catch (error) {
             toast({ variant: "destructive", title: "Error", description: `No se pudo eliminar el elemento. ${(error as Error).message}` });
        } finally {
             setIsLoading(false);
        }
    };

    return (
        <Card>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <CreateFolderDialog open={isCreateFolderOpen} onOpenChange={setCreateFolderOpen} onCreate={handleCreateFolder} />
            <CardHeader>
                <CardTitle>Disco</CardTitle>
                <CardDescription>Explorador de archivos y carpetas de la empresa.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4 p-2 rounded-md bg-muted">
                    <div className="flex items-center gap-1.5 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.path}>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                                    onClick={() => setCurrentPath(crumb.path)}
                                    disabled={isLoading}
                                >
                                    {index === 0 ? <Home className="h-4 w-4 mr-1" /> : null}
                                    {crumb.name}
                                </Button>
                                {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCreateFolderOpen(true)} disabled={isLoading}><FolderPlus className="mr-2 h-4 w-4" />Crear Carpeta</Button>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Upload className="mr-2 h-4 w-4" />Subir Archivo
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.path} className="group relative">
                            <div className="flex flex-col items-center justify-center p-4 border rounded-lg aspect-square cursor-pointer hover:bg-secondary/50"
                                onDoubleClick={() => item.type === 'folder' ? setCurrentPath(item.path) : window.open(item.url, '_blank')}
                            >
                                {item.type === 'folder' ? <Folder className="h-12 w-12 text-primary" /> : getFileIcon(item.fileType)}
                                <p className="text-center text-sm mt-2 truncate w-full">{item.name}</p>
                            </div>
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente {item.name}. Si es una carpeta, se eliminará todo su contenido.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item)}>Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
                 {filteredItems.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Esta carpeta está vacía.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
