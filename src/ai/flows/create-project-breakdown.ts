
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
      precioUnitario: z.string().optional().describe("El precio unitario de la partida. Ej: '12,50', 'N/A'."),
    }))
    .describe("Lista de partidas de obra para este capítulo.")
    .refine(partidas => partidas.every(p => p.descripcion && p.descripcion.trim() !== ''), {
      message: 'Todas las partidas deben tener una descripción no vacía.',
    }),
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
    Tu tarea es analizar la siguiente memoria de calidades o presupuesto, que está en formato PDF, y desglosarla en capítulos y partidas de obra.
    
    Instrucciones:
    1.  Lee atentamente el documento PDF adjunto.
    2.  Identifica los principales capítulos de la obra (ej: Demoliciones, Albañilería, Solados y Alicatados, Fontanería y Saneamiento, Electricidad, Climatización, Carpintería, etc.).
    3.  Para cada capítulo, extrae las partidas de obra específicas mencionadas.
    4.  Cada partida debe tener una descripción clara, su medición (si se especifica), la unidad de medida, y el precio unitario si está disponible.
    5.  Si una medición o precio no se especifica, puedes poner 'Según proyecto', 'N/A' o similar.
    6.  Organiza toda la información en la estructura JSON solicitada. No inventes información que no esté en el documento. Sé preciso y cíñete al contenido del PDF.
    7.  IMPORTANTE: Ignora cualquier partida que esté vacía o no contenga una descripción clara.

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
    return output;
  }
);

// Exported wrapper function for client-side use
export async function createProjectBreakdown(input: ProjectBreakdownInput): Promise<ProjectBreakdown> {
  return createProjectBreakdownFlow(input);
}
