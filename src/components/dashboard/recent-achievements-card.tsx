"use client"

import { useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, ExternalLink, FileText } from "lucide-react";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export function FormsResponsesCard({ forms, onLoadForms, onUpdateForm, onDeleteForm }: { forms: any[], onLoadForms: (data: any[]) => void, onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void }) {
  const formUrl = 'https://forms.gle/22PyvAxk8hAxGDTVA';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          toast({ variant: 'destructive', title: "Error al leer el CSV", description: results.errors.map(e => e.message).join(', ') });
          console.error("CSV Parsing Errors:", results.errors);
          return;
        }
        if (results.data.length === 0) {
             toast({ variant: 'destructive', title: "Archivo vacío o inválido", description: "El CSV no contiene datos o tiene un formato incorrecto." });
             return;
        }
        onLoadForms(results.data as any[]);
      },
      error: (error) => {
        toast({ variant: 'destructive', title: "Error al leer el archivo", description: error.message });
        console.error("PapaParse Error:", error);
      }
    });

    if (event.target) {
      event.target.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const getHeaders = () => {
    if (forms.length === 0) return [];
    // Combine keys from all objects to handle rows with missing columns
    const allKeys = forms.reduce((keys, form) => {
        Object.keys(form).forEach(key => {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        });
        return keys;
    }, [] as string[]);
    // Exclude my custom state fields
    return allKeys.filter(h => h !== 'id' && h !== 'called' && h !== 'status');
  }

  const headers = getHeaders();

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <CardTitle>Respuestas de Formularios</CardTitle>
            <CardDescription>Carga un archivo CSV con las respuestas del formulario para visualizarlas.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button onClick={triggerFileUpload}>
                <Upload className="mr-2 h-4 w-4"/>
                Cargar CSV
            </Button>
            <Button variant="outline" asChild>
                <a href={formUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Formulario
                </a>
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
            />
        </div>
      </CardHeader>
      <CardContent>
        {forms.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Llamado</TableHead>
                            <TableHead>Estado</TableHead>
                            {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.map(sub => (
                        <TableRow key={sub.id}>
                             <TableCell>
                                <Checkbox
                                    checked={sub.called}
                                    onCheckedChange={(checked) => onUpdateForm({ ...sub, called: !!checked })}
                                />
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={sub.status}
                                    onValueChange={(status) => onUpdateForm({ ...sub, status })}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="Contactado">Contactado</SelectItem>
                                        <SelectItem value="En proceso">En proceso</SelectItem>
                                        <SelectItem value="Firmado">Firmado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            {headers.map(header => (
                                <TableCell key={`${sub.id}-${header}`} className="max-w-[200px] truncate" title={sub[header]}>
                                    {sub[header]}
                                </TableCell>
                            ))}
                            <TableCell className="text-right">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la respuesta del formulario.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteForm(sub.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay datos de formularios</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Carga un archivo CSV para empezar a ver las respuestas aquí.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
