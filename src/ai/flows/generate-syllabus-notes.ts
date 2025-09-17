
'use server';
/**
 * @fileOverview Generates study notes for a given syllabus topic.
 *
 * - generateSyllabusNotes - A function that generates notes.
 * - GenerateSyllabusNotesInput - The input type for the generateSyllabusNotes function.
 * - GenerateSyllabusNotesOutput - The return type for the generateSyllabusNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyllabusNotesInputSchema = z.object({
  examName: z.string().describe('The name of the exam.'),
  topic: z.string().describe('The syllabus topic to generate notes for.'),
});
export type GenerateSyllabusNotesInput = z.infer<typeof GenerateSyllabusNotesInputSchema>;

const GenerateSyllabusNotesOutputSchema = z.object({
  notes: z.string().describe('The generated study notes in Markdown format.'),
});
export type GenerateSyllabusNotesOutput = z.infer<typeof GenerateSyllabusNotesOutputSchema>;

export async function generateSyllabusNotes(input: GenerateSyllabusNotesInput): Promise<GenerateSyllabusNotesOutput> {
  return generateSyllabusNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSyllabusNotesPrompt',
  input: {schema: GenerateSyllabusNotesInputSchema},
  output: {schema: GenerateSyllabusNotesOutputSchema},
  prompt: `You are an expert tutor and content creator for competitive exams. Your task is to generate extremely comprehensive, well-structured, and in-depth study notes for a specific topic within a given exam syllabus. The goal is to produce a document that is very detailed, roughly equivalent to 20 pages of content.

Exam: "{{examName}}"
Syllabus Topic: "{{topic}}"

Please generate very detailed and extensive notes on the specified topic. The notes must:
- Be accurate, thorough, and up-to-date.
- Cover all key concepts, definitions, theories, and important points related to the topic in great detail.
- Use clear and concise language, but do not sacrifice depth for brevity. Elaborate extensively on each point.
- Be structured logically with multiple levels of headings, subheadings, bullet points, and numbered lists to organize the vast amount of information.
- Include examples, case studies, and practical applications where relevant.
- Be suitable for a student preparing for the "{{examName}}" exam who needs a deep and comprehensive understanding of the topic.
- The final output should be a single, long-form text in Markdown format.
`,
});

const generateSyllabusNotesFlow = ai.defineFlow(
  {
    name: 'generateSyllabusNotesFlow',
    inputSchema: GenerateSyllabusNotesInputSchema,
    outputSchema: GenerateSyllabusNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
