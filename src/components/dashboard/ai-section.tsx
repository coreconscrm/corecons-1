
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, UploadCloud, FileText, CheckCircle, AlertCircle, X, ArrowUpDown, Database, Loader2, Save, Trash2, Search, FileUp, History, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs, writeBatch, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { createProjectBreakdown, type ProjectBreakdown } from "@/ai/flows/create-project-breakdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogHeader, DialogFooter, DialogClose, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";


// --- Tipos de Datos ---
type UploadStatus = "pending" | "uploading" | "processing" | "success" | "error";
type UploadedFile = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
  errorMessage?: string;
};
type PriceHistoryEntry = {
    precio: number;
    fecha: any; // Firestore Timestamp
    archivoOrigen: string;
}
type PriceMasterItem = {
  id: string;
  descripcion: string;
  unidad: string;
  capitulo: string;
  precioActual: number;
  fechaUltimaActualizacion: string;
  historialPrecios: PriceHistoryEntry[];
};
type SortConfig = {
  key: keyof PriceMasterItem;
  direction: "ascending" | "descending";
};


// --- Componente para Generador de Desglose ---
function ProjectBreakdownGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [breakdown, setBreakdown] = useState<ProjectBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un archivo PDF." });
      return;
    }

    setIsLoading(true);
    setBreakdown(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const result = await createProjectBreakdown({ pdfDataUri: dataUri });
          setBreakdown(result);
          toast({ title: "Desglose generado", description: "El proyecto ha sido desglosado exitosamente." });
        } catch (error) {
            console.error("Error generating breakdown:", error);
            toast({ variant: "destructive", title: "Error de IA", description: `No se pudo generar el desglose. ${(error as Error).message}` });
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ variant: "destructive", title: "Error de archivo", description: "No se pudo leer el archivo seleccionado." });
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Error setting up file reader:", e);
      toast({ variant: "destructive", title: "Error", description: `Ocurrió un error inesperado.` });
      setIsLoading(false);
    }
  };

  const handleSaveToPriceBase = async () => {
    if (!breakdown || !file) {
      toast({ variant: "destructive", title: "Error", description: "No hay desglose para guardar." });
      return;
    }
    
    setIsSaving(true);
    const allPartidas = breakdown.capitulos.flatMap(c => 
        c.partidas.map(p => ({ ...p, capitulo: c.nombre }))
    );
    let itemsAdded = 0;
    let itemsUpdated = 0;

    const pricesRef = collection(db, "preciosMaestros");
    const batch = writeBatch(db);

    try {
      for (const partida of allPartidas) {
        const precioString = partida.precioUnitario?.replace(',', '.') ?? '0';
        if (!partida.precioUnitario || isNaN(parseFloat(precioString))) {
            continue;
        }

        const q = query(pricesRef, where("descripcion", "==", partida.descripcion));
        const querySnapshot = await getDocs(q);

        const precio = parseFloat(precioString);
        const fecha = new Date();
        const archivoOrigen = file.name;

        const newHistoryEntry = { precio, fecha, archivoOrigen };
        
        if (querySnapshot.empty) {
          // Si no existe, crea una nueva entrada
          const newDocRef = doc(pricesRef);
          batch.set(newDocRef, {
            descripcion: partida.descripcion,
            unidad: partida.unidad,
            capitulo: partida.capitulo,
            precioActual: precio,
            fechaUltimaActualizacion: fecha,
            historialPrecios: [newHistoryEntry]
          });
          itemsAdded++;
        } else {
          // Si existe, actualiza el historial
          const docId = querySnapshot.docs[0].id;
          const docRef = doc(pricesRef, docId);
          const existingData = querySnapshot.docs[0].data();
          const newHistory = [...(existingData.historialPrecios || []), newHistoryEntry];
          
          batch.update(docRef, {
              precioActual: precio,
              fechaUltimaActualizacion: fecha,
              historialPrecios: newHistory
          });
          itemsUpdated++;
        }
      }

      await batch.commit();
      toast({
        title: "Base de Precios Actualizada",
        description: `${itemsAdded} precios nuevos añadidos y ${itemsUpdated} precios actualizados.`,
      });
    } catch (error) {
        console.error("Error saving to price base:", error);
        toast({ variant: "destructive", title: "Error al guardar", description: `No se pudieron guardar los precios. ${(error as Error).message}` });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Desglose de Proyecto</CardTitle>
          <CardDescription>Sube una memoria de calidades en PDF para que la IA genere un desglose estructurado del proyecto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-center">
              {isDragActive
                ? "Suelta el archivo aquí..."
                : "Arrastra y suelta un PDF aquí, o haz clic para seleccionar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Solo archivos PDF</p>
          </div>
          {file && (
            <div className="p-3 border rounded-lg text-sm flex items-center justify-between">
              <p className="truncate font-medium flex items-center gap-2">
                <FileText size={16} /> {file.name}
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
                <X size={16} />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={!file || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Generando..." : "Generar Desglose"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultado del Desglose</CardTitle>
          <CardDescription>Aquí aparecerán los capítulos y partidas generados por la IA.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-60">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Analizando documento y generando desglose...</p>
            </div>
          )}
          {breakdown && breakdown.capitulos.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {breakdown.capitulos.map((capitulo, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">{capitulo.nombre}</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partida</TableHead>
                          <TableHead className="text-right">Medición</TableHead>
                          <TableHead className="text-center">Unidad</TableHead>
                          <TableHead className="text-right">Precio/Ud.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {capitulo.partidas.map((partida, pIndex) => (
                          <TableRow key={pIndex}>
                            <TableCell>{partida.descripcion}</TableCell>
                            <TableCell className="text-right">{partida.medicion}</TableCell>
                            <TableCell className="text-center">{partida.unidad}</TableCell>
                            <TableCell className="text-right">{partida.precioUnitario}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
                <p>El resultado aparecerá aquí después de la generación.</p>
              </div>
            )
          )}
        </CardContent>
        {breakdown && breakdown.capitulos.length > 0 && (
          <CardFooter>
            <Button onClick={handleSaveToPriceBase} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Incluir en Base de Precios
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


// --- Componente de Carga de Archivos ---
function FileUploadSection({ onUploadSuccess }: { onUploadSuccess: (fileName: string) => void }) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: "pending",
      id: `${file.name}-${Date.now()}`,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach(upload => {
      const storageRef = ref(storage, `presupuestos-importados/${upload.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, upload.file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploads(prev =>
            prev.map(u => u.id === upload.id ? { ...u, progress, status: "uploading" } : u)
          );
        },
        (error) => {
          console.error("Upload error:", error);
          setUploads(prev =>
            prev.map(u => u.id === upload.id ? { ...u, status: "error", errorMessage: error.message } : u)
          );
          toast({ variant: "destructive", title: "Error en la subida", description: `El archivo ${upload.file.name} no pudo subirse.` });
        },
        async () => {
          try {
            await getDownloadURL(uploadTask.snapshot.ref);
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: "processing" } : u));
            onUploadSuccess(upload.file.name);
            setTimeout(() => {
              setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: "success" } : u));
            }, 1000);
          } catch (error) {
            console.error("Error finalizing upload:", error);
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: "error", errorMessage: (error as Error).message } : u));
          }
        }
      );
    });
  }, [onUploadSuccess, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
  });
  
  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'processing');

  const getStatusContent = (upload: UploadedFile) => {
    switch (upload.status) {
      case "uploading":
        return <Progress value={upload.progress} className="w-full" />;
      case "processing":
         return <p className="text-xs text-blue-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Procesando datos...</p>;
      case "success":
        return <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={14} /> Proceso completado.</p>;
      case "error":
        return <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={14} /> {upload.errorMessage}</p>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Presupuestos</CardTitle>
        <CardDescription>Sube archivos para extraer precios y añadirlos a la base de datos centralizada.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-center">
            {isDragActive
              ? "Suelta los archivos aquí..."
              : "Arrastra y suelta archivos aquí, o haz clic para seleccionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, XLSX</p>
        </div>
        <div className="mt-4 space-y-3">
          {activeUploads.map((upload) => (
            <div key={upload.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <p className="truncate font-medium flex items-center gap-2">
                  <FileText size={16} /> {upload.file.name}
                </p>
                <p className="font-mono text-muted-foreground">{upload.progress.toFixed(0)}%</p>
              </div>
              <div className="mt-2">{getStatusContent(upload)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Componente de Tabla de Precios ---
function PriceTable({ 
    prices, 
    onViewDescription, 
    onViewOrigin, 
    onDeleteItem,
    onViewHistory,
}: { 
    prices: PriceMasterItem[], 
    onViewDescription: (description: string) => void, 
    onViewOrigin: (origin: string) => void, 
    onDeleteItem: (id: string) => void,
    onViewHistory: (item: PriceMasterItem) => void,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  const filteredAndSortedPrices = useMemo(() => {
    let sortableItems = [...prices];

    if (searchTerm) {
      sortableItems = sortableItems.filter((item) =>
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.capitulo && item.capitulo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [prices, searchTerm, sortConfig]);

  const requestSort = (key: keyof PriceMasterItem) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof PriceMasterItem) => {
      if (!sortConfig || sortConfig.key !== key) {
          return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      }
      return sortConfig.direction === 'ascending' ? 
          <ArrowUpDown className="h-4 w-4 ml-2" /> : 
          <ArrowUpDown className="h-4 w-4 ml-2 transform rotate-180" />;
  };

  return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle>Consulta de Precios</CardTitle>
                  <CardDescription>Busca en la base de datos de precios centralizada.</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por descripción o capítulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 max-w-sm"
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("capitulo")} className="cursor-pointer">
                      <div className="flex items-center">Capítulo {getSortIcon("capitulo")}</div>
                  </TableHead>
                  <TableHead onClick={() => requestSort("descripcion")} className="cursor-pointer">
                      <div className="flex items-center">Descripción {getSortIcon("descripcion")}</div>
                  </TableHead>
                  <TableHead onClick={() => requestSort("unidad")} className="cursor-pointer">
                      <div className="flex items-center">Unidad {getSortIcon("unidad")}</div>
                  </TableHead>
                  <TableHead onClick={() => requestSort("precioActual")} className="cursor-pointer">
                      <div className="flex items-center">Precio Unitario {getSortIcon("precioActual")}</div>
                  </TableHead>
                  <TableHead onClick={() => requestSort("fechaUltimaActualizacion")} className="cursor-pointer">
                      <div className="flex items-center">Fecha Act. {getSortIcon("fechaUltimaActualizacion")}</div>
                  </TableHead>
                  <TableHead>Historial</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPrices.length > 0 ? (
                  filteredAndSortedPrices.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.capitulo}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate cursor-pointer hover:underline" onClick={() => onViewDescription(item.descripcion)}>
                          {item.descripcion}
                        </div>
                      </TableCell>
                      <TableCell>{item.unidad}</TableCell>
                      <TableCell>€{item.precioActual?.toFixed(2)}</TableCell>
                      <TableCell>{item.fechaUltimaActualizacion}</TableCell>
                      <TableCell>
                          {(item.historialPrecios?.length || 0) > 1 ? (
                              <Button variant="outline" size="sm" onClick={() => onViewHistory(item)}>
                                  <History className="mr-2 h-4 w-4" />
                                  Ver ({(item.historialPrecios?.length)})
                              </Button>
                          ) : (
                            <Badge variant="secondary">Nuevo</Badge>
                          )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate cursor-pointer hover:underline" onClick={() => onViewOrigin(item.historialPrecios?.[item.historialPrecios.length-1]?.archivoOrigen)}>
                            {item.historialPrecios?.[item.historialPrecios.length-1]?.archivoOrigen}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Seguro que quieres eliminar esta partida?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          "{item.descripcion}" y todo su historial de precios serán eliminados permanentemente.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteItem(item.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No se encontraron precios. Sube un presupuesto para empezar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
  );
}

function HistoryDialog({
    item,
    open,
    onOpenChange,
    onSetCurrentPrice
}: {
    item: PriceMasterItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSetCurrentPrice: (itemId: string, newPrice: number) => void;
}) {
    if (!item) return null;

    const sortedHistory = [...(item.historialPrecios || [])].sort((a,b) => {
        const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
        const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Historial de Precios</DialogTitle>
                    <DialogDescription>{item.descripcion}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Precio</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedHistory.map((entry, index) => (
                                <TableRow key={index} className={entry.precio === item.precioActual ? "bg-primary/10" : ""}>
                                    <TableCell>€{entry.precio.toFixed(2)}</TableCell>
                                    <TableCell>{entry.fecha?.toDate ? format(entry.fecha.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                    <TableCell>{entry.archivoOrigen}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => onSetCurrentPrice(item.id, entry.precio)}
                                            disabled={entry.precio === item.precioActual}
                                        >
                                            <Undo className="mr-2 h-4 w-4" /> Usar este precio
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- Componente de la Sección de Base de Precios ---
function PriceDatabaseSection() {
    const { toast } = useToast();
    const [prices, setPrices] = useState<PriceMasterItem[]>([]);
    const [viewingDescription, setViewingDescription] = useState<string | null>(null);
    const [viewingOrigin, setViewingOrigin] = useState<string | null>(null);
    const [viewingHistory, setViewingHistory] = useState<PriceMasterItem | null>(null);


    useEffect(() => {
        const q = query(collection(db, "preciosMaestros"), orderBy("fechaUltimaActualizacion", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const priceData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            fechaUltimaActualizacion: doc.data().fechaUltimaActualizacion?.toDate ? format(doc.data().fechaUltimaActualizacion.toDate(), "dd/MM/yyyy HH:mm") : 'N/A',
          })) as PriceMasterItem[];
          setPrices(priceData);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteAll = async () => {
      const pricesRef = collection(db, "preciosMaestros");
      try {
          const querySnapshot = await getDocs(pricesRef);
          const batch = writeBatch(db);
          querySnapshot.forEach(doc => {
              batch.delete(doc.ref);
          });
          await batch.commit();
          toast({ title: "Base de precios eliminada", description: "Se han borrado todos los precios." });
      } catch (error) {
          console.error("Error deleting all prices:", error);
          toast({ variant: "destructive", title: "Error al borrar", description: `No se pudieron eliminar todos los precios. ${(error as Error).message}`});
      }
    };
  
    const handleDeleteItem = async (id: string) => {
      try {
          await deleteDoc(doc(db, "preciosMaestros", id));
          toast({ title: "Precio eliminado", description: "La partida ha sido eliminada." });
      } catch (error) {
          console.error(`Error deleting price ${id}:`, error);
          toast({ variant: "destructive", title: "Error al eliminar", description: `No se pudo eliminar la partida. ${(error as Error).message}`});
      }
    };
    
    const handleSetCurrentPrice = async (itemId: string, newPrice: number) => {
        const itemDocRef = doc(db, "preciosMaestros", itemId);
        try {
            await updateDoc(itemDocRef, {
                precioActual: newPrice
            });
            toast({ title: "Precio Actualizado", description: `El precio de la partida ha sido restaurado.`});
            setViewingHistory(null);
        } catch(error) {
            console.error("Error setting current price:", error);
            toast({ variant: "destructive", title: "Error al actualizar", description: `No se pudo cambiar el precio. ${(error as Error).message}`});
        }
    };

    // Simula la Cloud Function de extracción de precios
    const simulatePriceExtraction = useCallback(async (fileName: string) => {
        console.log(`Simulating extraction for: ${fileName}`);

        // Datos de ejemplo
        const extractedData = [
            { capitulo: 'Demoliciones', descripcion: `Demolición de tabique (de ${fileName})`, unidad: 'm2', precio: 8.75 },
            { capitulo: 'Techos', descripcion: 'Falso techo de pladur', unidad: 'm2', precio: 22.50 },
            { capitulo: 'Electricidad', descripcion: 'Punto de luz completo', unidad: 'ud', precio: 65.00 },
        ];

        const pricesRef = collection(db, "preciosMaestros");
        
        try {
            const batch = writeBatch(db);
            for (const item of extractedData) {
                const q = query(pricesRef, where("descripcion", "==", item.descripcion));
                const querySnapshot = await getDocs(q);
                
                const fecha = new Date();
                const newHistoryEntry = { precio: item.precio, fecha, archivoOrigen: fileName };

                if (querySnapshot.empty) {
                    const newDocRef = doc(pricesRef);
                    batch.set(newDocRef, {
                        ...item,
                        precioActual: item.precio,
                        fechaUltimaActualizacion: fecha,
                        historialPrecios: [newHistoryEntry]
                    });
                } else {
                    const docId = querySnapshot.docs[0].id;
                    const docRef = doc(pricesRef, docId);
                    const existingData = querySnapshot.docs[0].data();
                    const newHistory = [...(existingData.historialPrecios || []), newHistoryEntry];
                    batch.update(docRef, {
                       precioActual: item.precio,
                       fechaUltimaActualizacion: fecha,
                       historialPrecios: newHistory
                    });
                }
            }
            await batch.commit();
            toast({
                title: "Proceso completado",
                description: `Se han añadido/actualizado ${extractedData.length} precios desde ${fileName}.`,
            });
        } catch (error) {
            console.error("Error saving prices to Firestore:", error);
            toast({ variant: "destructive", title: "Error al guardar", description: "No se pudieron guardar los precios en la base de datos." });
        }
    }, [toast]);

    return (
      <>
        <Dialog open={!!viewingDescription} onOpenChange={() => setViewingDescription(null)}>
          <DialogContent>
              <DialogHeader><DialogTitle>Descripción Completa</DialogTitle></DialogHeader>
              <ScrollArea className="max-h-[60vh] my-4"><div className="whitespace-pre-wrap break-words pr-4">{viewingDescription}</div></ScrollArea>
              <DialogFooter><Button variant="outline" onClick={() => setViewingDescription(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!viewingOrigin} onOpenChange={() => setViewingOrigin(null)}>
          <DialogContent>
              <DialogHeader><DialogTitle>Origen del Archivo</DialogTitle></DialogHeader>
              <div className="py-4 whitespace-pre-wrap break-words">{viewingOrigin}</div>
              <DialogFooter><Button variant="outline" onClick={() => setViewingOrigin(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <HistoryDialog
            item={viewingHistory}
            open={!!viewingHistory}
            onOpenChange={() => setViewingHistory(null)}
            onSetCurrentPrice={handleSetCurrentPrice}
        />

        <Tabs defaultValue="consult" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid grid-cols-2 w-auto">
                  <TabsTrigger value="consult"><Search className="mr-2" />Consulta de Precios</TabsTrigger>
                  <TabsTrigger value="import"><FileUp className="mr-2" />Importar Presupuestos</TabsTrigger>
              </TabsList>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Borrar Base de Precios
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente
                              toda la base de precios.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAll}>Sí, borrar todo</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
            <TabsContent value="consult">
                <PriceTable 
                    prices={prices} 
                    onViewDescription={setViewingDescription} 
                    onViewOrigin={setViewingOrigin} 
                    onDeleteItem={handleDeleteItem}
                    onViewHistory={setViewingHistory}
                />
            </TabsContent>
            <TabsContent value="import">
                <FileUploadSection onUploadSuccess={simulatePriceExtraction} />
            </TabsContent>
        </Tabs>
      </>
    );
}


// --- Sección Principal de IA ---
export function AiSection() {
    return (
        <Tabs defaultValue="breakdown-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="breakdown-generator">
                  <BrainCircuit className="mr-2" /> Desglose de Proyecto
                </TabsTrigger>
                <TabsTrigger value="content-generator">Generador de Contenido</TabsTrigger>
                <TabsTrigger value="price-database"><Database className="mr-2" />Base de Precios</TabsTrigger>
            </TabsList>
            <TabsContent value="breakdown-generator" className="mt-6">
                <ProjectBreakdownGenerator />
            </TabsContent>
            <TabsContent value="content-generator">
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Asistente de IA para Contenidos</CardTitle>
                                <CardDescription>
                                    Genera descripciones, textos para redes sociales y más.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Próximamente: Herramientas de IA para ayudarte a crear contenido atractivo para tus proyectos, memorias y comunicaciones.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="price-database" className="mt-6">
                <PriceDatabaseSection />
            </TabsContent>
        </Tabs>
    );
}
