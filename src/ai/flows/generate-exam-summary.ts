'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a student's exam performance.
 *
 * It includes:
 * - generateExamSummary - An asynchronous function that takes exam results as input and returns a summary of the student's performance.
 * - GenerateExamSummaryInput - The input type for the generateExamSummary function, defining the structure of the exam results.
 * - GenerateExamSummaryOutput - The output type for the generateExamSummary function, defining the structure of the generated summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamSummaryInputSchema = z.object({
  studentName: z.string().describe('The name of the student who took the exam.'),
  examName: z.string().describe('The name of the exam.'),
  questions: z.array(
    z.object({
      questionText: z.string().describe('The text of the question.'),
      studentAnswer: z.string().describe("The student's answer to the question."),
      isCorrect: z.boolean().describe("Whether the student's answer was correct."),
      feedback: z.string().optional().describe('Optional feedback on the student\'s answer.'),
    })
  ).describe('An array of questions and the student\'s performance on each.'),
});
export type GenerateExamSummaryInput = z.infer<typeof GenerateExamSummaryInputSchema>;

const GenerateExamSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the student\'s performance on the exam, highlighting strengths and weaknesses, and providing actionable advice for improvement.'),
});
export type GenerateExamSummaryOutput = z.infer<typeof GenerateExamSummaryOutputSchema>;

export async function generateExamSummary(input: GenerateExamSummaryInput): Promise<GenerateExamSummaryOutput> {
  return generateExamSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamSummaryPrompt',
  input: {schema: GenerateExamSummaryInputSchema},
  output: {schema: GenerateExamSummaryOutputSchema},
  prompt: `You are an AI assistant who helps teachers by summarizing student exam performance for competitive exams (like UPSC, SSC, GATE, etc.).

  Given the following information about a student's performance on an exam, generate a summary of their overall performance. 
  Highlight their strengths and weaknesses. Be encouraging and provide actionable advice for improvement, focusing on how they can better prepare for future competitive exams.

  Student Name: {{{studentName}}}
  Exam Name: {{{examName}}}

  Questions:
  {{#each questions}}
  Question: {{{questionText}}}
  Student Answer: {{{studentAnswer}}}
  Correct: {{#if isCorrect}}Yes{{else}}No{{/if}}
  {{#if feedback}}
  Feedback: {{{feedback}}}
  {{/if}}
  {{/each}}
  `,
});

const generateExamSummaryFlow = ai.defineFlow(
  {
    name: 'generateExamSummaryFlow',
    inputSchema: GenerateExamSummaryInputSchema,
    outputSchema: GenerateExamSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
