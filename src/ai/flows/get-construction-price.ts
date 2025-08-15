
'use server';
/**
 * @fileOverview Flow to get construction material prices.
 *
 * - getConstructionPrice - A function that returns a price for a construction item.
 * - ConstructionPriceInput - The input type for the getConstructionPrice function.
 * - ConstructionPriceOutput - The return type for the getConstructionPrice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConstructionPriceInputSchema = z.object({
  query: z.string().describe('The construction item to get a price for.'),
});
export type ConstructionPriceInput = z.infer<typeof ConstructionPriceInputSchema>;

const ConstructionPriceOutputSchema = z.object({
  response: z.string().describe('The AI-generated response with the price information.'),
});
export type ConstructionPriceOutput = z.infer<typeof ConstructionPriceOutputSchema>;

export async function getConstructionPrice(input: ConstructionPriceInput): Promise<ConstructionPriceOutput> {
  return getConstructionPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getConstructionPricePrompt',
  input: { schema: ConstructionPriceInputSchema },
  output: { schema: ConstructionPriceOutputSchema },
  prompt: `
    Eres un experto asesor de costes de construcción en España con acceso a precios de mercado actualizados.
    Tu tarea es responder a las consultas de los usuarios sobre precios de partidas de obra, materiales o unidades de trabajo.
    Proporciona una respuesta clara, concisa y directa. Incluye un precio estimado o un rango de precios si es posible, especificando siempre la unidad (m², ml, ud, kg, etc.).
    Si la pregunta es ambigua, pide más detalles. Si no puedes proporcionar un precio, explícalo cortésmente.

    Consulta del usuario:
    {{{query}}}
  `,
});

const getConstructionPriceFlow = ai.defineFlow(
    {
      name: 'getConstructionPriceFlow',
      inputSchema: ConstructionPriceInputSchema,
      outputSchema: ConstructionPriceOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('La IA no pudo generar una respuesta.');
        }
        return output;
    }
);
