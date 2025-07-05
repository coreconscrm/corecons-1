"use client"

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Link, RefreshCw } from "lucide-react";

export function FormsResponsesCard({ forms, onUpdateForm, onDeleteForm }: { forms: any[], onUpdateForm: (form: any) => void, onDeleteForm: (id: any) => void }) {
  const [formUrl, setFormUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const { toast } = useToast();

  const handleStatusChange = (form: any, newStatus: string) => {
    onUpdateForm({ ...form, status: newStatus });
  };
  
  const handleSync = () => {
    if (!formUrl || !sheetUrl) {
      toast({
        variant: 'destructive',
        title: 'Faltan URLs',
        description: 'Por favor, introduce las URLs del formulario y de la hoja de cálculo.',
      });
      return;
    }
    toast({
      title: 'Sincronización iniciada',
      description: 'Los datos se están actualizando desde Google Sheets. (Esto es una simulación)',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Respuestas de Formularios</CardTitle>
        <CardDescription>Conecta tu Google Form y Google Sheet para ver las respuestas aquí.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Conexión con Google</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-url">URL del Formulario de Google</Label>
              <div className="flex items-center gap-2">
                <Link className="text-muted-foreground" />
                <Input id="form-url" placeholder="https://docs.google.com/forms/..." value={formUrl} onChange={(e) => setFormUrl(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-url">URL de la Hoja de Google</Label>
              <div className="flex items-center gap-2">
                <Link className="text-muted-foreground" />
                <Input id="sheet-url" placeholder="https://docs.google.com/spreadsheets/..." value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
              </div>
            </div>
          </div>
          <Button onClick={handleSync}>
            <RefreshCw className="mr-2 h-4 w-4"/>
            Sincronizar Respuestas
          </Button>
          <p className="text-xs text-muted-foreground italic">
            Nota: La sincronización es simulada. En una aplicación real, esto requeriría autenticación con Google y acceso a sus APIs.
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Respuestas Recibidas</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map(sub => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.name}</TableCell>
                <TableCell>{sub.email}</TableCell>
                <TableCell>{sub.date}</TableCell>
                <TableCell>
                  <Select value={sub.status} onValueChange={(newStatus) => handleStatusChange(sub, newStatus)}>
                    <SelectTrigger className="w-[120px] p-1 h-auto focus:ring-0">
                      <SelectValue asChild>
                         <Badge variant={sub.status === 'Contactado' ? 'default' : 'outline'}>
                            {sub.status}
                          </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Contactado">Contactado</SelectItem>
                      <SelectItem value="No interesado">No interesado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
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
      </CardContent>
    </Card>
  );
}
