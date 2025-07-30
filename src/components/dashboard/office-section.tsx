
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

export function OfficeSection() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building />
                    Oficina
                </CardTitle>
                <CardDescription>
                    Este es el espacio central para la gestión interna. Próximamente añadiremos más herramientas aquí.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">Sección en Construcción</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Dime qué necesitas construir en esta sección.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
