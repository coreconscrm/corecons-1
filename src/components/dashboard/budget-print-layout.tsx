"use client";

import type { Budget } from './budgets-card';
import { Building2 } from "lucide-react";

export function BudgetPrintLayout({ budget, client }: { budget: Budget | null, client: any }) {
  if (!budget || !client) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white text-black p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
            <Building2 className="h-12 w-12 text-gray-800" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">WinnBuilders</h1>
                <p className="text-sm text-gray-600">Soluciones Integrales de Construcción</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase text-gray-500">Presupuesto</h2>
          <p className="text-sm text-gray-500 mt-1">Fecha: {currentDate}</p>
          <p className="text-sm text-gray-500">Presupuesto #: {budget.id.toUpperCase()}</p>
        </div>
      </header>

      {/* Client Info */}
      <section className="my-8 flex justify-between">
         <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Presupuesto Para:</h3>
            <p className="font-bold text-lg text-gray-800">{client.name}</p>
            <p className="text-gray-600">{client.contact}</p>
            <p className="text-gray-600">{client.email}</p>
            <p className="text-gray-600">{client.phone}</p>
        </div>
        <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Nombre del Proyecto:</h3>
            <p className="font-bold text-lg text-gray-800">{budget.name}</p>
        </div>
      </section>

      {/* Line Items Table */}
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 font-semibold uppercase text-sm">Descripción</th>
              <th className="p-3 text-right font-semibold uppercase text-sm">Medición</th>
              <th className="p-3 text-center font-semibold uppercase text-sm">Unidad</th>
              <th className="p-3 text-right font-semibold uppercase text-sm">Precio Unitario</th>
              <th className="p-3 text-right font-semibold uppercase text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {budget.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-center">{item.unit}</td>
                <td className="p-3 text-right font-mono">€{item.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono">€{(item.quantity * item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="mt-8 flex justify-end">
        <div className="w-full max-w-sm">
            <div className="flex justify-between items-center bg-gray-200 p-4 rounded-t-lg">
                <span className="text-xl font-bold text-gray-800">TOTAL PRESUPUESTO</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                    €{budget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="border-l border-r border-b border-gray-200 p-4 rounded-b-lg">
                <p className="text-xs text-gray-500">Precios sin IVA. Validez del presupuesto: 30 días.</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4">
        <p>Gracias por confiar en WinnBuilders.</p>
        <p>C/ Falsa 123, 08001 Barcelona | info@winnbuilders.com | +34 930 000 000</p>
      </footer>
    </div>
  );
}
