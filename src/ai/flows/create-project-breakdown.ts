
'use server';
/**
 * @fileOverview Flow to generate a project breakdown from a quality specification PDF.
 *
 * - createProjectBreakdown - A function that handles the project breakdown process.
 * - ProjectBreakdownInput - The input type for the createProjectBreakdown function.
 * - ProjectBreakdown - The return type for the createProjectBreakdown function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: A PDF file provided as a data URI
const ProjectBreakdownInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file of a construction quality specification (memoria de calidades), as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  chapterName: z.string().optional().describe("An optional chapter name to assign to all extracted line items. If provided, the AI will not look for chapters in the document.")
});
export type ProjectBreakdownInput = z.infer<typeof ProjectBreakdownInputSchema>;

// Output Schema: A structured project breakdown
const ProjectBreakdownSchema = z.object({
  capitulos: z.array(z.object({
    nombre: z.string().describe("Nombre del capítulo, por ejemplo: 'Albañilería', 'Fontanería', 'Electricidad'."),
    partidas: z.array(z.object({
      descripcion: z.string().describe("Descripción detallada de la partida de obra."),
      medicion: z.string().optional().describe("La cantidad o medición de la partida, por ejemplo: '250', 'Según proyecto'."),
      unidad: z.string().optional().describe("La unidad de medida, por ejemplo: 'm²', 'ml', 'ud'."),
      precioUnitario: z.string().optional().describe("El precio unitario de la partida. Extrae SÓLO el valor numérico. Ej: '12.50' o '12,50'. Si no hay precio, deja el campo vacío."),
    }))
    .describe("Lista de partidas de obra para este capítulo."),
  })).describe("Lista de capítulos que componen el proyecto."),
});
export type ProjectBreakdown = z.infer<typeof ProjectBreakdownSchema>;


// Prompt definition
const projectBreakdownPrompt = ai.definePrompt({
  name: 'projectBreakdownPrompt',
  input: { schema: ProjectBreakdownInputSchema },
  output: { schema: ProjectBreakdownSchema },
  prompt: `
    Eres un jefe de obra experto en construcción con más de 20 años de experiencia en España.
    Tu tarea es analizar la siguiente memoria de calidades o presupuesto, que está en formato PDF, y desglosarla.

    Instrucciones Generales:
    1.  Lee atentamente el documento PDF adjunto.
    2.  Para cada partida de obra, extrae la 'descripcion', 'medicion' (cantidad) y 'unidad' de medida si se especifican. Es crucial que la 'descripcion' de cada partida sea lo más completa y detallada posible, extrayendo todo el texto descriptivo asociado a ella sin abreviar ni omitir detalles.
    3.  **MUY IMPORTANTE**: Para el campo 'precioUnitario', extrae ÚNICAMENTE el valor numérico del precio (ej: '12.50', '12,50'). NO incluyas el símbolo del euro (€), texto como '/ud' o '/m2'. Si no se especifica un precio numérico claro, deja el campo 'precioUnitario' vacío o nulo.
    4.  Organiza toda la información en la estructura JSON solicitada. No inventes información que no esté en el documento. Sé preciso y cíñete al contenido del PDF.
    5.  IMPORTANTE: Ignora cualquier partida que esté vacía o no contenga una descripción clara.
    
    {{#if chapterName}}
    Instrucciones Específicas para este análisis:
    -   El documento puede contener partidas iniciales sin un título de capítulo claro. Agrupa todas las partidas iniciales bajo el capítulo "{{chapterName}}". Debes continuar añadiendo partidas a este capítulo hasta que encuentres el próximo título de capítulo explícito en el documento.
    -   Una vez que encuentres un nuevo título de capítulo, crea un nuevo capítulo separado para él y continúa analizando el resto del documento de forma normal, creando más capítulos a medida que los encuentres.
    -   El resultado final debe ser un objeto JSON que contenga el capítulo "{{chapterName}}" primero, seguido de cualquier otro capítulo que hayas identificado en el resto del documento.
    {{else}}
    Instrucciones Específicas para este análisis:
    -   Identifica los principales capítulos de la obra (ej: Demoliciones, Albañilería, Solados y Alicatados, etc.).
    -   Para cada capítulo, extrae las partidas de obra específicas mencionadas.
    {{/if}}

    Documento a analizar:
    {{media url=pdfDataUri}}
  `,
});

// Flow definition
const createProjectBreakdownFlow = ai.defineFlow(
  {
    name: 'createProjectBreakdownFlow',
    inputSchema: ProjectBreakdownInputSchema,
    outputSchema: ProjectBreakdownSchema,
  },
  async (input) => {
    const { output } = await projectBreakdownPrompt(input);
    
    if (!output) {
      throw new Error("La IA no pudo generar un desglose del proyecto.");
    }
    
    // Data cleansing
    const cleanedCapitulos = output.capitulos.map(capitulo => ({
      ...capitulo,
      partidas: capitulo.partidas.map(partida => ({
        ...partida,
        precioUnitario: partida.precioUnitario?.replace(/[^0-9,.]/g, '') || undefined,
      })),
    }));

    return { capitulos: cleanedCapitulos };
  }
);

// Exported wrapper function for client-side use
export async function createProjectBreakdown(input: ProjectBreakdownInput): Promise<ProjectBreakdown> {
  return createProjectBreakdownFlow(input);
}
