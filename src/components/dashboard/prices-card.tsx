"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PriceItem = {
    description: string;
    unit: string;
    price: number;
};

type Provider = {
    id: string;
    name: string;
    priceList?: PriceItem[];
};

export function PriceListCard({ providers }: { providers: Provider[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const allPrices = useMemo(() => {
        return providers.flatMap(provider => 
            (provider.priceList || []).map(priceItem => ({
                ...priceItem,
                providerId: provider.id,
                providerName: provider.name
            }))
        );
    }, [providers]);

    const filteredPrices = useMemo(() => {
        if (!searchTerm) return allPrices;
        return allPrices.filter(item => 
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.providerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allPrices, searchTerm]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Base de Precios de Proveedores</CardTitle>
                <CardDescription>Consulta y busca en la lista de precios de todos tus proveedores.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Input 
                        placeholder="Buscar por descripción o proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <div className="rounded-md border">
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead className="text-center">Unidad</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrices.length > 0 ? filteredPrices.map((item, index) => (
                                    <TableRow key={`${item.providerId}-${index}`}>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell>{item.providerName}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{item.unit}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            €{item.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No se encontraron precios. Añade precios a tus proveedores para verlos aquí.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
