
'use server';
/**
 * @fileOverview Flow to generate a priority report from form submissions.
 *
 * - createFormsReport - A function that handles the report generation process.
 * - FormsReportInput - The input type for the createFormsReport function.
 * - FormsReport - The return type for the createFormsReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: A JSON string of form submissions
const FormsReportInputSchema = z.object({
  formsJson: z
    .string()
    .describe(
      "A JSON string representing an array of form submissions. Each object in the array is a contact lead."
    ),
});
export type FormsReportInput = z.infer<typeof FormsReportInputSchema>;

// Output Schema: A structured report
const FormsReportSchema = z.object({
  obraNueva: z.array(z.object({
      ciudad: z.string().describe("La ciudad donde se agrupan los contactos."),
      contactos: z.array(z.object({
          nombre: z.string().describe("Nombre del contacto."),
          prioridad: z.enum(["Alta", "Media", "Baja"]).describe("La prioridad asignada al contacto."),
          telefono: z.string().optional().describe("Teléfono de contacto."),
          email: z.string().optional().describe("Email de contacto."),
          origen: z.string().optional().describe("El registro original del formulario en formato JSON string."),
      })).describe("Lista de contactos de obra nueva para esta ciudad."),
  })).describe("Lista de ciudades con proyectos de obra nueva.").optional(),
  reformas: z.array(z.object({
      ciudad: z.string().describe("La ciudad donde se agrupan los contactos."),
      contactos: z.array(z.object({
          nombre: z.string().describe("Nombre del contacto."),
          prioridad: z.enum(["Alta", "Media", "Baja"]).describe("La prioridad asignada al contacto."),
          telefono: z.string().optional().describe("Teléfono de contacto."),
          email: z.string().optional().describe("Email de contacto."),
          origen: z.string().optional().describe("El registro original del formulario en formato JSON string."),
      })).describe("Lista de contactos de reformas para esta ciudad."),
  })).describe("Lista de ciudades con proyectos de reforma.").optional(),
});
export type FormsReport = z.infer<typeof FormsReportSchema>;

// Prompt definition
const formsReportPrompt = ai.definePrompt({
  name: 'formsReportPrompt',
  input: { schema: FormsReportInputSchema },
  output: { schema: FormsReportSchema },
  prompt: `
    Eres un asistente de gestión de proyectos para una constructora. Tu tarea es analizar una lista de leads (contactos) que han llegado desde un formulario y generar un reporte priorizado.

    Instrucciones:
    1.  Analiza la lista de contactos proporcionada en formato JSON.
    2.  Clasifica cada contacto en una de dos categorías principales: "Obra Nueva" o "Reformas". La clasificación debe basarse **principalmente** en el campo \`¿Que Tipo de Proyecto Necesitas?\` del formulario. Si el valor es \`Obra Nueva\`, clasifícalo como tal. Si es \`Reforma\`, clasifícalo en \`Reformas\`. Como apoyo, también puedes buscar palabras clave como "construir", "solar", "terreno" para la primera categoría, y "reformar", "piso", "local" para la segunda.
    3.  Dentro de cada categoría, agrupa los contactos por ciudad. Si la ciudad no está especificada, agrúpalos en "Ciudad no especificada".
    4.  Para cada contacto, asigna una prioridad: "Alta", "Media" o "Baja".
        -   **Prioridad Alta**: Asigna esta prioridad a los contactos que indiquen explícitamente que ya tienen "terreno" o "solar" Y que también tienen "proyecto de arquitecto". También considera alta prioridad si proporcionan muchos datos de contacto y detalles del proyecto.
        -   **Prioridad Media**: Contactos que tienen terreno o proyecto, pero no ambos, o que proporcionan información de contacto completa pero pocos detalles del proyecto.
        -   **Prioridad Baja**: Contactos con información muy limitada o que parecen estar en una fase muy inicial de exploración.
    5.  **MUY IMPORTANTE**: Asegúrate de incluir a TODOS los contactos del formulario en el reporte, correctamente agrupados y priorizados. No dejes ninguno fuera.
    6.  En el campo 'origen' de cada contacto en el resultado, incluye el objeto JSON original completo del lead.
    7.  Extrae el nombre, teléfono y email de cada contacto si están disponibles. Los nombres de los campos en el JSON de entrada pueden variar (ej: 'Nombre', 'nombre', 'Teléfono', 'telefono', 'email', 'Email', etc.). Sé inteligente para identificarlos.

    Lista de contactos a analizar:
    {{{formsJson}}}
  `,
});

// Flow definition
const createFormsReportFlow = ai.defineFlow(
  {
    name: 'createFormsReportFlow',
    inputSchema: FormsReportInputSchema,
    outputSchema: FormsReportSchema,
  },
  async (input) => {
    const { output } = await formsReportPrompt(input);
    if (!output) {
      throw new Error("La IA no pudo generar un reporte de los formularios.");
    }
    // Ensure both keys exist in the final output, even if empty.
    return {
        obraNueva: output.obraNueva || [],
        reformas: output.reformas || [],
    };
  }
);

// Exported wrapper function for client-side use
export async function createFormsReport(input: FormsReportInput): Promise<FormsReport> {
  return createFormsReportFlow(input);
}
