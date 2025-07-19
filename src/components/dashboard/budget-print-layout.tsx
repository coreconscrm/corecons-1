
"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import type { Budget } from './budgets-card';
import type { Company } from './company-card';
import { Building2, Globe, Mail, Phone } from "lucide-react";
import type { AiBudgetItem } from "./ai-section";

function PrintLayoutHeader({ company }: { company: Company | null }) {
  if (!company) {
    return (
      <div className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">PRESUPUESTO</h1>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
      <div className="flex items-center gap-6">
        {company.logo ? (
          <Image src={company.logo} alt={`${company.name} logo`} width={120} height={50} className="object-contain" data-ai-hint="logo" />
        ) : (
          <Building2 className="h-16 w-16 text-gray-800" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-sm text-gray-600">{company.address}</p>
          <p className="text-sm text-gray-600">CIF: {company.cif}</p>
          <div className="text-sm text-gray-600 flex flex-col mt-1">
            <span className="flex items-center gap-2"><Phone size={12} /> {company.phone}</span>
            <span className="flex items-center gap-2"><Mail size={12} /> {company.email}</span>
            {company.web && <a href={company.web} className="flex items-center gap-2 hover:underline"><Globe size={12} /> {company.web}</a>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-semibold uppercase text-gray-500">Presupuesto</h2>
        <p className="text-sm text-gray-500 mt-1">Fecha: {currentDate}</p>
      </div>
    </header>
  );
}

function PrintLayoutFooter({ company }: { company: Company | null }) {
  if (!company) return <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4"><p>Documento generado por WinnBuilders CRM.</p></footer>;
  return (
    <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4">
      <p>Gracias por confiar en {company.name}.</p>
      <p>{company.address} | {company.email} | {company.phone}</p>
    </footer>
  );
}

export function AiBudgetPrintLayout({ budget, company }: { budget: AiBudgetItem | null, company: Company | null }) {
  if (!budget) return null;

  const budgetTotals = useMemo(() => {
    let grandTotal = 0;
    if (budget.breakdown.capitulos) {
        for (const capitulo of budget.breakdown.capitulos) {
            const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                const price = budget.userPrices?.[capitulo.nombre]?.[partida.descripcion] || 0;
                const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                return sum + (price * quantity);
            }, 0);
            grandTotal += chapterTotal;
        }
    }
    return grandTotal;
  }, [budget.breakdown, budget.userPrices]);

  return (
    <div className="bg-white text-black p-8 font-sans">
      <PrintLayoutHeader company={company} />

      <section className="my-8 flex justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Presupuesto Para:</h3>
          <p className="font-bold text-lg text-gray-800">{budget.clientName || "Cliente sin especificar"}</p>
        </div>
        <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Nombre del Proyecto:</h3>
            <p className="font-bold text-lg text-gray-800">{budget.title}</p>
        </div>
      </section>
      
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
            {(budget.breakdown.capitulos || []).map((capitulo, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td colSpan={5} className="p-3 bg-gray-50 font-bold text-gray-700">{capitulo.nombre}</td>
                </tr>
                {(capitulo.partidas || []).map((partida, pIndex) => {
                  const unitPrice = budget.userPrices?.[capitulo.nombre]?.[partida.descripcion] || 0;
                  const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                  const total = unitPrice * quantity;
                  return (
                    <tr key={pIndex} className="border-b border-gray-100">
                      <td className="p-3">{partida.descripcion}</td>
                      <td className="p-3 text-right">{partida.medicion}</td>
                      <td className="p-3 text-center">{partida.unidad}</td>
                      <td className="p-3 text-right font-mono">€{unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono">€{total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 flex justify-between items-end">
        <div className="text-xs text-gray-500 w-1/2 whitespace-pre-line">
            <h4 className="font-bold text-gray-600 uppercase mb-2">Condiciones y Notas</h4>
            <p>{company?.validity}</p>
            <p>{company?.paymentMethods}</p>
        </div>
        <div className="w-full max-w-sm">
            <div className="flex justify-between items-center bg-gray-200 p-4 rounded-t-lg">
                <span className="text-xl font-bold text-gray-800">TOTAL PRESUPUESTO</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                    €{budgetTotals.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="border-l border-r border-b border-gray-200 p-4 rounded-b-lg">
                <p className="text-xs text-gray-500">Este es un documento informativo y no contractual hasta su firma.</p>
            </div>
        </div>
      </section>

      <PrintLayoutFooter company={company} />
    </div>
  );
}


export function BudgetPrintLayout({ budget, client, company }: { budget: Budget | null, client: any, company: Company | null }) {
  if (!budget || !client) {
    return null;
  }
  
  return (
    <div className="bg-white text-black p-8 font-sans">
      <PrintLayoutHeader company={company} />

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
            {(budget.lineItems || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-center">{item.unit}</td>
                <td className="p-3 text-right font-mono">€{(item.unitPrice || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono">€{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals & Notes */}
      <section className="mt-8 flex justify-between items-end">
        <div className="text-xs text-gray-500 w-1/2 whitespace-pre-line">
            <h4 className="font-bold text-gray-600 uppercase mb-2">Condiciones y Notas</h4>
            <p>{company?.validity}</p>
            <p>{company?.paymentMethods}</p>
        </div>
        <div className="w-full max-w-sm">
            <div className="flex justify-between items-center bg-gray-200 p-4 rounded-t-lg">
                <span className="text-xl font-bold text-gray-800">TOTAL PRESUPUESTO</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                    €{budget.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="border-l border-r border-b border-gray-200 p-4 rounded-b-lg">
                <p className="text-xs text-gray-500">Este es un documento informativo y no contractual hasta su firma.</p>
            </div>
        </div>
      </section>

      <PrintLayoutFooter company={company} />
    </div>
  );
}
