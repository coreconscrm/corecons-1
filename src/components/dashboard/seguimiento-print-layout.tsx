
"use client";

import React from "react";
import type { Seguimiento } from './seguimiento-card';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function SeguimientoPrintLayout({ title, seguimientos }: { title: string, seguimientos: Seguimiento[] }) {
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
            
            <section className="mt-8">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-2 font-semibold uppercase text-xs">Nombre</th>
                            <th className="p-2 font-semibold uppercase text-xs">Teléfono</th>
                            <th className="p-2 font-semibold uppercase text-xs">Email</th>
                            <th className="p-2 font-semibold uppercase text-xs">Localización</th>
                            <th className="p-2 font-semibold uppercase text-xs">Estado</th>
                            <th className="p-2 font-semibold uppercase text-xs">Por Hacer</th>
                            <th className="p-2 font-semibold uppercase text-xs">Próx. Llamada</th>
                            <th className="p-2 font-semibold uppercase text-xs">Información</th>
                        </tr>
                    </thead>
                    <tbody>
                         {(seguimientos || []).map((s, index) => (
                            <tr key={s.id} className="border-b border-gray-100">
                                <td className="p-2 align-top text-xs">{s.name}</td>
                                <td className="p-2 align-top text-xs">{s.phone}</td>
                                <td className="p-2 align-top text-xs">{s.email}</td>
                                <td className="p-2 align-top text-xs">{s.localizacion}</td>
                                <td className="p-2 align-top text-xs capitalize">{s.estado}</td>
                                <td className="p-2 align-top text-xs capitalize">{s.porHacer}</td>
                                <td className="p-2 align-top text-xs">
                                    {s.siguienteLlamada && isValid(parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date()))
                                        ? format(parse(s.siguienteLlamada, 'dd/MM/yyyy', new Date()), 'dd/MM/yy')
                                        : 'N/A'}
                                </td>
                                <td className="p-2 align-top text-xs whitespace-pre-wrap">{s.informacion}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4">
                <p>Documento generado por WinnBuilders CRM.</p>
            </footer>
        </div>
    );
}

