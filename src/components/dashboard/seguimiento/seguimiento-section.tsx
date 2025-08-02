
"use client"

import { SeguimientoListCard } from '../seguimiento-card';

export function SeguimientoSection({
    seguimientos,
    onAddSeguimiento,
    onUpdateSeguimiento,
    onDeleteSeguimiento,
    estadoOptions,
    porHacerOptions,
    categories,
    onSeguimientoOptionsChange
}: {
    seguimientos: any[];
    onAddSeguimiento: (s: any) => void;
    onUpdateSeguimiento: (s: any) => void;
    onDeleteSeguimiento: (id: string) => void;
    estadoOptions: string[];
    porHacerOptions: string[];
    categories: string[];
    onSeguimientoOptionsChange: (type: 'estado' | 'porHacer' | 'categories', options: string[]) => void;
}) {
    return (
        <SeguimientoListCard
            seguimientos={seguimientos}
            onAddSeguimiento={onAddSeguimiento}
            onUpdateSeguimiento={onUpdateSeguimiento}
            onDeleteSeguimiento={onDeleteSeguimiento}
            estadoOptions={estadoOptions}
            porHacerOptions={porHacerOptions}
            categories={categories}
            onSeguimientoOptionsChange={onSeguimientoOptionsChange}
        />
    );
}
