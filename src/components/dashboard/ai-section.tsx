
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, UploadCloud, FileText, CheckCircle, AlertCircle, X, ArrowUpDown, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { format } from "date-fns";

// --- Tipos de Datos ---
type UploadStatus = "pending" | "uploading" | "processing" | "success" | "error";
type UploadedFile = {
  file: File;
  progress: number;
  status: UploadStatus;
  id: string;
  errorMessage?: string;
};
type PriceMasterItem = {
  id: string;
  descripcion: string;
  unidad: string;
  precioUnitario: number;
  fechaImportacion: string;
  archivoOrigen: string;
};
type SortConfig = {
  key: keyof PriceMasterItem;
  direction: "ascending" | "descending";
};

// --- Componente de Carga de Archivos ---
function FileUploader({ onUploadComplete, onUploadSuccess }: { onUploadComplete: (fileName: string) => void, onUploadSuccess: (fileId: string) => void }) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as UploadStatus,
      id: `${file.name}-${Date.now()}`,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach((upload) => {
      const storageRef = ref(storage, `presupuestos-importados/${upload.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, upload.file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id ? { ...u, progress: progress, status: "uploading" } : u
            )
          );
        },
        (error) => {
          console.error("Upload error:", error);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { ...u, status: "error", errorMessage: error.message }
                : u
            )
          );
          toast({ variant: "destructive", title: "Error en la subida", description: `El archivo ${upload.file.name} no pudo subirse.` });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(() => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id ? { ...u, progress: 100, status: "processing" } : u
              )
            );
            onUploadComplete(upload.file.name);
            
            setTimeout(() => {
                 setUploads((prev) => prev.map((u) => u.id === upload.id ? { ...u, status: "success" } : u));
                 onUploadSuccess(upload.id);
            }, 1000); 
          });
        }
      );
    });
  }, [onUploadComplete, toast, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
  });

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
        <CardDescription>Sube archivos para extraer precios automáticamente.</CardDescription>
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
          <p className="text-xs text-muted-foreground mt-1">PDF, DOCS, XLSX</p>
        </div>
        <div className="mt-4 space-y-3">
          {uploads.map((upload) => (
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
function PriceTable() {
  const [prices, setPrices] = useState<PriceMasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  useEffect(() => {
    const q = query(collection(db, "preciosMaestros"), orderBy("fechaImportacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const priceData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaImportacion: format(doc.data().fechaImportacion.toDate(), "dd/MM/yyyy HH:mm"),
      })) as PriceMasterItem[];
      setPrices(priceData);
    });
    return () => unsubscribe();
  }, []);

  const filteredAndSortedPrices = useMemo(() => {
    let sortableItems = [...prices];

    if (searchTerm) {
      sortableItems = sortableItems.filter((item) =>
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
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
        <CardTitle>Consulta de Precios</CardTitle>
        <CardDescription>Busca en la base de datos de precios centralizada.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Buscar por descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 max-w-sm"
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort("descripcion")} className="cursor-pointer">
                    <div className="flex items-center">Descripción {getSortIcon("descripcion")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("unidad")} className="cursor-pointer">
                    <div className="flex items-center">Unidad {getSortIcon("unidad")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("precioUnitario")} className="cursor-pointer">
                    <div className="flex items-center">Precio Unitario {getSortIcon("precioUnitario")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("fechaImportacion")} className="cursor-pointer">
                    <div className="flex items-center">Fecha {getSortIcon("fechaImportacion")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("archivoOrigen")} className="cursor-pointer">
                    <div className="flex items-center">Origen {getSortIcon("archivoOrigen")}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPrices.length > 0 ? (
                filteredAndSortedPrices.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                    <TableCell>{item.unidad}</TableCell>
                    <TableCell>€{item.precioUnitario.toFixed(2)}</TableCell>
                    <TableCell>{item.fechaImportacion}</TableCell>
                    <TableCell className="truncate max-w-xs">{item.archivoOrigen}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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

// --- Sección Principal de IA ---
export function AiSection() {
    const { toast } = useToast();

    // Simula la Cloud Function de extracción de precios
    const simulatePriceExtraction = useCallback(async (fileName: string) => {
        console.log(`Simulating extraction for: ${fileName}`);

        // Datos de ejemplo
        const extractedData = [
            { descripcion: `Demolición de tabique (de ${fileName})`, unidad: 'm2', precioUnitario: 8.75 },
            { descripcion: 'Falso techo de pladur', unidad: 'm2', precioUnitario: 22.50 },
            { descripcion: 'Punto de luz completo', unidad: 'ud', precioUnitario: 65.00 },
        ];

        const pricesRef = collection(db, "preciosMaestros");
        const batch = writeBatch(db);

        for (const item of extractedData) {
            const q = query(pricesRef, where("descripcion", "==", item.descripcion));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Añadir nuevo documento
                const newDocRef = doc(pricesRef);
                batch.set(newDocRef, {
                    ...item,
                    fechaImportacion: serverTimestamp(),
                    archivoOrigen: fileName,
                });
            } else {
                // Actualizar documento existente
                const docId = querySnapshot.docs[0].id;
                const docRef = doc(pricesRef, docId);
                batch.update(docRef, {
                    precioUnitario: item.precioUnitario,
                    fechaImportacion: serverTimestamp(),
                    archivoOrigen: fileName,
                });
            }
        }
        
        try {
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
    
    const handleUploadSuccess = useCallback(() => {
        // Podríamos añadir lógica aquí si fuera necesario
    }, []);

    return (
        <Tabs defaultValue="price-database">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content-generator">Generador de Contenido</TabsTrigger>
                <TabsTrigger value="price-database"><Database className="mr-2" />Base de Precios</TabsTrigger>
            </TabsList>
            <TabsContent value="content-generator">
                <Card>
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
            <TabsContent value="price-database">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <FileUploader 
                        onUploadComplete={simulatePriceExtraction} 
                        onUploadSuccess={handleUploadSuccess} 
                    />
                    <PriceTable />
                </div>
            </TabsContent>
        </Tabs>
    );
}

    