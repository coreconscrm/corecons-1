
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
  const { grandTotal, chapterTotals } = useMemo(() => {
      if (!budget) return { grandTotal: 0, chapterTotals: {} };
      let grandTotal = 0;
      const chapterTotals: Record<string, number> = {};

      if (budget.breakdown.capitulos) {
          for (const capitulo of budget.breakdown.capitulos) {
              const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                  const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                  return sum + lineTotal;
              }, 0);
              chapterTotals[capitulo.nombre] = chapterTotal;
              grandTotal += chapterTotal;
          }
      }
      return { grandTotal, chapterTotals };
  }, [budget]);

  if (!budget) return null;

  return (
    <div className="bg-white text-black p-8 font-sans print:text-sm">
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
        <table className="w-full text-left table-fixed">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 font-semibold uppercase text-sm w-[65%]">Descripción</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">Medición</th>
              <th className="p-3 text-center font-semibold uppercase text-sm w-[10%]">Unidad</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">€/U.</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[15%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {(budget.breakdown.capitulos || []).map((capitulo, index) => (
              <React.Fragment key={index}>
                <tr className="page-break-before">
                  <td colSpan={5} className="p-3 print:py-1.5 bg-gray-50 font-bold text-gray-700">{capitulo.nombre}</td>
                </tr>
                {(capitulo.partidas || []).map((partida, pIndex) => {
                  const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                  const quantity = parseFloat(String(partida.medicion).replace(',', '.')) || 1;
                  const unitPrice = quantity !== 0 ? lineTotal / quantity : 0;
                  return (
                    <tr key={pIndex} className="border-b border-gray-100">
                      <td className="p-3 print:py-1 print:text-xs">{partida.descripcion}</td>
                      <td className="p-3 print:py-1 text-right print:text-xs">{partida.medicion}</td>
                      <td className="p-3 print:py-1 text-center print:text-xs">{partida.unidad}</td>
                      <td className="p-3 print:py-1 text-right font-mono print:text-xs">€{unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 print:py-1 text-right font-mono print:text-xs">€{lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>
      
      <div className="page-break-before">
        <section className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de Capítulos</h3>
          <table className="w-full max-w-md ml-auto text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                  <tr>
                      <th className="p-3 font-semibold uppercase text-sm">Capítulo</th>
                      <th className="p-3 font-semibold uppercase text-sm text-right">Total</th>
                  </tr>
              </thead>
              <tbody>
                  {Object.entries(chapterTotals).map(([nombre, total]) => (
                      <tr key={nombre} className="border-b border-gray-100">
                          <td className="p-3 print:py-1 font-semibold">{nombre}</td>
                          <td className="p-3 print:py-1 text-right font-mono">
                            €{total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                      </tr>
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
                      €{grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
              </div>
              <div className="border-l border-r border-b border-gray-200 p-4 rounded-b-lg">
                  <p className="text-xs text-gray-500">Este es un documento informativo y no contractual hasta su firma.</p>
              </div>
          </div>
        </section>
      </div>

      <PrintLayoutFooter company={company} />
    </div>
  );
}


export function BudgetPrintLayout({ budget, client, company }: { budget: Budget | null, client: any, company: Company | null }) {
  if (!budget || !client) {
    return null;
  }
  
  return (
    <div className="bg-white text-black p-8 font-sans print:text-sm">
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
        <table className="w-full text-left table-fixed">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 font-semibold uppercase text-sm w-[65%]">Descripción</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">Medición</th>
              <th className="p-3 text-center font-semibold uppercase text-sm w-[10%]">Unidad</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">€/U.</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[15%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {(budget.lineItems || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3 print:py-1 print:text-xs">{item.description}</td>
                <td className="p-3 print:py-1 text-right print:text-xs">{item.quantity}</td>
                <td className="p-3 print:py-1 text-center print:text-xs">{item.unit}</td>
                <td className="p-3 print:py-1 text-right font-mono print:text-xs">€{(item.unitPrice || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 print:py-1 text-right font-mono print:text-xs">€{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
