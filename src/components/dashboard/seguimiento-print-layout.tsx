
"use client";

import React, { useMemo } from "react";
import type { Seguimiento } from './seguimiento-card';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function SeguimientoPrintLayout({ title, seguimientos }: { title: string, seguimientos: Seguimiento[] }) {
    
    const groupedSeguimientos = useMemo(() => {
        const groups: Record<string, Seguimiento[]> = {};
        seguimientos.forEach(s => {
            const category = s.category || 'General';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(s);
        });
        return groups;
    }, [seguimientos]);

    if (seguimientos.length === 0) {
        return null; // Don't render anything if there's no data to print
    }

    const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    return (
        <div className="bg-white text-black p-8 font-sans print:text-sm">
            <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">WinnBuilders CRM</h1>
                    <p className="text-sm text-gray-600">{title}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold uppercase text-gray-500">Informe de Seguimiento</h2>
                    <p className="text-xs text-gray-500 mt-1">Fecha: {currentDate}</p>
                </div>
            </header>
            
            <section className="mt-8 space-y-6">
                {Object.entries(groupedSeguimientos).map(([category, items]) => (
                    <div key={category} className="page-break-inside-avoid">
                        <h3 className="text-lg font-bold text-gray-700 mb-2 p-2 bg-gray-100 rounded-md">{category}</h3>
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Nombre</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Teléfono</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Email</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Localización</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Estado</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '7%' }}>Por Hacer</th>
                                    <th className="p-2 font-semibold uppercase text-[7px]" style={{ width: '8%' }}>Próx. Llamada</th>
                                    <th className="p-2 font-semibold uppercase text-xs" style={{ width: '50%' }}>Información</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(items || []).map((s) => (
                                    <tr key={s.id} className="border-b border-gray-100 page-break-inside-avoid">
                                        <td className="p-2 align-top text-[7px] break-words">{s.name}</td>
                                        <td className="p-2 align-top text-[7px] break-words">{s.phone}</td>
                                        <td className="p-2 align-top text-[7px] break-words">{s.email}</td>
                                        <td className="p-2 align-top text-[7px] break-words">{s.localizacion}</td>
                                        <td className="p-2 align-top text-[7px] capitalize break-words">{s.estado}</td>
                                        <td className="p-2 align-top text-[7px] capitalize break-words">{s.porHacer}</td>
                                        <td className="p-2 align-top text-[7px] break-words">
                                            {s.siguienteLlamada && isValid(parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date()))
                                                ? format(parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date()), 'dd/MM/yy')
                                                : 'N/A'}
                                        </td>
                                        <td className="p-2 align-top text-xs whitespace-pre-wrap break-words text-justify">{s.informacion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </section>
            
            <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4 page-break-before:always">
                <p>Documento generado por WinnBuilders CRM.</p>
            </footer>
        </div>
    );
}
