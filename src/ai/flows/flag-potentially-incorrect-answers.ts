'use server';
/**
 * @fileOverview Flags potentially incorrect or incomplete answers in student responses.
 *
 * - flagPotentiallyIncorrectAnswers - A function that flags potentially incorrect or incomplete answers.
 * - FlagPotentiallyIncorrectAnswersInput - The input type for the flagPotentiallyIncorrectAnswers function.
 * - FlagPotentiallyIncorrectAnswersOutput - The return type for the flagPotentiallyIncorrectAnswers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagPotentiallyIncorrectAnswersInputSchema = z.object({
  question: z.string().describe('The question that was asked.'),
  studentAnswer: z.string().describe('The student\'s answer to the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type FlagPotentiallyIncorrectAnswersInput = z.infer<typeof FlagPotentiallyIncorrectAnswersInputSchema>;

const FlagPotentiallyIncorrectAnswersOutputSchema = z.object({
  isPotentiallyIncorrect: z.boolean().describe('Whether the student\'s answer is potentially incorrect or incomplete.'),
  reason: z.string().describe('The reason why the answer is flagged as potentially incorrect or incomplete.'),
});
export type FlagPotentiallyIncorrectAnswersOutput = z.infer<typeof FlagPotentiallyIncorrectAnswersOutputSchema>;

export async function flagPotentiallyIncorrectAnswers(input: FlagPotentiallyIncorrectAnswersInput): Promise<FlagPotentiallyIncorrectAnswersOutput> {
  return flagPotentiallyIncorrectAnswersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flagPotentiallyIncorrectAnswersPrompt',
  input: {schema: FlagPotentiallyIncorrectAnswersInputSchema},
  output: {schema: FlagPotentiallyIncorrectAnswersOutputSchema},
  prompt: `You are an expert teacher reviewing student answers.

You will be given a question, the student\'s answer, and the correct answer.

Your task is to determine if the student\'s answer is potentially incorrect or incomplete based on the correct answer.

Question: {{{question}}}
Student\'s Answer: {{{studentAnswer}}}
Correct Answer: {{{correctAnswer}}}

Determine if the student's answer is potentially incorrect or incomplete. If it is, explain why in the reason field. Set the isPotentiallyIncorrect field appropriately.
`,
});

const flagPotentiallyIncorrectAnswersFlow = ai.defineFlow(
  {
    name: 'flagPotentiallyIncorrectAnswersFlow',
    inputSchema: FlagPotentiallyIncorrectAnswersInputSchema,
    outputSchema: FlagPotentiallyIncorrectAnswersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
