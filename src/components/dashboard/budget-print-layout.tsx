
"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import type { Budget } from './budgets-card';
import type { Company } from './company-card';
import { Building2, Globe, Mail, Phone } from "lucide-react";
import type { AiBudgetItem } from "./ai/ai-section";


// --- Header Component ---
function PrintLayoutHeader({ company }: { company: Company | null }) {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
      <div className="flex items-center gap-6">
        {company?.logo ? (
          <Image src={company.logo} alt={`${company.name} logo`} width={120} height={50} className="object-contain" data-ai-hint="logo" unoptimized />
        ) : (
          <Building2 className="h-16 w-16 text-gray-800" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{company?.name || "Nombre de la Empresa"}</h1>
          {company && (
            <>
              <p className="text-sm text-gray-600">{company.address}</p>
              <p className="text-sm text-gray-600">CIF: {company.cif}</p>
              <div className="text-sm text-gray-600 flex flex-col mt-1">
                {company.phone && <span className="flex items-center gap-2"><Phone size={12} /> {company.phone}</span>}
                {company.email && <span className="flex items-center gap-2"><Mail size={12} /> {company.email}</span>}
                {company.web && <a href={company.web} className="flex items-center gap-2 hover:underline"><Globe size={12} /> {company.web}</a>}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-semibold uppercase text-gray-500">Presupuesto</h2>
        <p className="text-sm text-gray-500 mt-1">Fecha: {currentDate}</p>
      </div>
    </header>
  );
}

// --- Footer Component ---
function PrintLayoutFooter({ company }: { company: Company | null }) {
  return (
    <footer className="mt-16 text-center text-xs text-gray-400 border-t pt-4">
      <p>Gracias por confiar en {company?.name || "nosotros"}.</p>
      {company && <p>{company.address} | {company.email} | {company.phone}</p>}
      {!company && <p>Documento generado por WinnBuilders CRM.</p>}
    </footer>
  );
}

// --- Main Print Layout Component ---
export function BudgetPrintLayout({ budget, client, company, hideUnitPrice }: { budget: Budget | null, client: any, company: Company | null, hideUnitPrice?: boolean }) {
  const { chapterTotals, grandTotal } = useMemo(() => {
    const totals: Record<string, number> = {};
    let currentChapter = "";
    let grandTotal = 0;

    (budget?.lineItems || []).forEach(item => {
      if (item.isChapter) {
        currentChapter = item.description || "";
        if (!totals[currentChapter]) {
          totals[currentChapter] = 0;
        }
      } else {
        const lineTotal = item.unitPrice || 0;
        if (currentChapter) {
          totals[currentChapter] = (totals[currentChapter] || 0) + lineTotal;
        }
        grandTotal += lineTotal;
      }
    });
    return { chapterTotals: totals, grandTotal };
  }, [budget]);

  if (!budget || !client) {
    return null;
  }
  
  return (
    <div className="bg-white text-black p-8 font-sans print:text-sm">
      <PrintLayoutHeader company={company} />

      <section className="my-8 flex justify-between">
         <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Presupuesto Para:</h3>
            <p className="font-bold text-lg text-gray-800">{client.name || "Cliente sin especificar"}</p>
            {client.contact && <p className="text-gray-600">{client.contact}</p>}
            {client.email && <p className="text-gray-600">{client.email}</p>}
            {client.phone && <p className="text-gray-600">{client.phone}</p>}
        </div>
        <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Nombre del Proyecto:</h3>
            <p className="font-bold text-lg text-gray-800">{budget.name}</p>
        </div>
      </section>

      <section>
        <table className="w-full text-left table-fixed">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className={`p-3 font-semibold uppercase text-sm ${hideUnitPrice ? 'w-[75%]' : 'w-[65%]'}`}>Descripción</th>
              <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">Nº</th>
              <th className="p-3 text-center font-semibold uppercase text-sm w-[10%]">Unidad</th>
              {!hideUnitPrice && <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">€/U.</th>}
              <th className="p-3 text-right font-semibold uppercase text-sm w-[15%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {(budget.lineItems || []).map((item, index) => {
              if (item.isChapter) {
                return (
                  <tr key={index} className={index !== 0 ? 'page-break-before' : ''}>
                    <td colSpan={hideUnitPrice ? 4 : 5} className="p-3 print:py-1.5 bg-gray-50 font-bold text-gray-700">{item.description}</td>
                  </tr>
                );
              }
              
              const lineTotal = item.unitPrice || 0;
              const quantity = item.quantity || 0;
              const unitPriceValue = quantity > 0 ? lineTotal / quantity : 0;
              
              return (
                <tr key={index} className="border-b border-gray-100">
                  <td className="p-3 print:py-1 print:text-xs">{item.description}</td>
                  <td className="p-3 print:py-1 print:pl-[30px] text-right print:text-xs">{item.quantity}</td>
                  <td className="p-3 print:py-1 text-center print:text-xs">{item.unit}</td>
                  {!hideUnitPrice && <td className="p-3 print:py-1 text-right font-mono print:text-xs whitespace-nowrap">{`${unitPriceValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0€`}</td>}
                  <td className="p-3 print:py-1 text-right font-mono print:text-xs whitespace-nowrap">{`${lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0€`}</td>
                </tr>
              );
            })}
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
                          <td className="p-3 print:py-1 text-right font-mono whitespace-nowrap">
                            {`€${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </section>
      </div>

      <div className="page-break-before">
        <section className="mt-8 flex justify-between items-end">
            <div className="text-xs text-gray-500 w-1/2 whitespace-pre-line">
                <h4 className="font-bold text-gray-600 uppercase mb-2">Condiciones y Notas</h4>
                <p>{company?.validity}</p>
                <p>{company?.paymentMethods}</p>
            </div>
            <div className="w-full max-w-sm">
                <div className="flex justify-between items-center bg-gray-200 p-4 rounded-t-lg">
                    <span className="text-xl font-bold text-gray-800">TOTAL PRESUPUESTO</span>
                    <span className="text-xl font-bold font-mono text-gray-900 whitespace-nowrap">
                        {`€${grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

export function AiBudgetPrintLayout({ budget, company }: { budget: AiBudgetItem | null, company: Company | null }) {
    const { chapterTotals, grandTotal } = useMemo(() => {
        const totals: Record<string, number> = {};
        let grandTotal = 0;

        if (budget?.breakdown.capitulos) {
            for (const capitulo of budget.breakdown.capitulos) {
                const chapterTotal = (capitulo.partidas || []).reduce((sum, partida) => {
                    const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                    return sum + lineTotal;
                }, 0);
                totals[capitulo.nombre] = chapterTotal;
                grandTotal += chapterTotal;
            }
        }
        return { chapterTotals: totals, grandTotal };
    }, [budget]);

    if (!budget) {
        return null;
    }

    const clientInfo = {
        name: budget.clientName || "Cliente sin especificar",
        contact: "",
        email: "",
        phone: "",
    };

    return (
        <div className="bg-white text-black p-8 font-sans print:text-sm">
            <PrintLayoutHeader company={company} />

            <section className="my-8 flex justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Presupuesto Para:</h3>
                    <p className="font-bold text-lg text-gray-800">{clientInfo.name}</p>
                    {budget.description && <p className="text-gray-600">{budget.description}</p>}
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
                            <th className="p-3 text-right font-semibold uppercase text-sm w-[10%]">Nº</th>
                            <th className="p-3 text-center font-semibold uppercase text-sm w-[10%]">Unidad</th>
                            <th className="p-3 text-right font-semibold uppercase text-sm w-[15%]">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                    {budget.breakdown.capitulos.map((capitulo, index) => (
                        <React.Fragment key={index}>
                            <tr className={index !== 0 ? 'page-break-before' : ''}>
                                <td colSpan={4} className="p-3 print:py-1.5 bg-gray-50 font-bold text-gray-700">{capitulo.nombre}</td>
                            </tr>
                            {capitulo.partidas.map((partida, pIndex) => {
                                const lineTotal = budget.userLineTotals?.[capitulo.nombre]?.[partida.descripcion] || 0;
                                return (
                                <tr key={pIndex} className="border-b border-gray-100">
                                    <td className="p-3 print:py-1 print:text-xs">{partida.descripcion}</td>
                                    <td className="p-3 print:py-1 print:pl-[30px] text-right print:text-xs">{partida.medicion}</td>
                                    <td className="p-3 print:py-1 text-center print:text-xs">{partida.unidad}</td>
                                    <td className="p-3 print:py-1 text-right font-mono print:text-xs whitespace-nowrap">
                                    {`${lineTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0€`}
                                    </td>
                                </tr>
                                );
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
                                    <td className="p-3 print:py-1 text-right font-mono whitespace-nowrap">
                                        {`€${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>

            <div className="page-break-before">
                <section className="mt-8 flex justify-between items-end">
                    <div className="text-xs text-gray-500 w-1/2 whitespace-pre-line">
                        <h4 className="font-bold text-gray-600 uppercase mb-2">Condiciones y Notas</h4>
                        <p>{company?.validity}</p>
                        <p>{company?.paymentMethods}</p>
                    </div>
                    <div className="w-full max-w-sm">
                        <div className="flex justify-between items-center bg-gray-200 p-4 rounded-t-lg">
                            <span className="text-xl font-bold text-gray-800">TOTAL PRESUPUESTO</span>
                            <span className="text-xl font-bold font-mono text-gray-900 whitespace-nowrap">
                                {`€${grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
