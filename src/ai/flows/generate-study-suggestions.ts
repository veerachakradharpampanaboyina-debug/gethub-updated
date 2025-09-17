
'use server';
/**
 * @fileOverview Generates personalized study suggestions for a student.
 *
 * - generateStudySuggestions - A function that analyzes performance and provides recommendations.
 * - GenerateStudySuggestionsInput - The input type for the function.
 * - GenerateStudySuggestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import handlebars from 'handlebars';

// Helper to join array elements in Handlebars templates.
handlebars.registerHelper('join', function(arr: string[], separator: string) {
    if (arr && Array.isArray(arr)) {
      return arr.join(separator);
    }
    return '';
});

const GenerateStudySuggestionsInputSchema = z.object({
  recentExams: z.array(
    z.object({
      examName: z.string(),
      scorePercentage: z.number(),
      incorrectlyAnsweredTopics: z.array(z.string()),
    })
  ).describe("The student's recent exam performance."),
  syllabusProgress: z.array(
      z.object({
          examName: z.string(),
          completionPercentage: z.number(),
          revisionTopics: z.array(z.string()),
      })
  ).describe("The student's current syllabus progress for various exams.")
});
export type GenerateStudySuggestionsInput = z.infer<typeof GenerateStudySuggestionsInputSchema>;

const GenerateStudySuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('Personalized, actionable study suggestions in Markdown format, including links to relevant practice topics.'),
});
export type GenerateStudySuggestionsOutput = z.infer<typeof GenerateStudySuggestionsOutputSchema>;


export async function generateStudySuggestions(input: GenerateStudySuggestionsInput): Promise<GenerateStudySuggestionsOutput> {
  return generateStudySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudySuggestionsPrompt',
  input: {schema: GenerateStudySuggestionsInputSchema},
  output: {schema: GenerateStudySuggestionsOutputSchema},
  prompt: `You are an expert AI tutor for competitive exams. Your task is to analyze a student's recent performance and syllabus progress to provide 3-4 actionable study suggestions.

Analyze the following data:

**Recent Exam Performance:**
{{#each recentExams}}
- **{{examName}}**: Scored {{scorePercentage}}%.
  {{#if incorrectlyAnsweredTopicsJoined}}
  - Topics with incorrect answers: {{incorrectlyAnsweredTopicsJoined}}
  {{/if}}
{{/each}}

**Syllabus Progress:**
{{#each syllabusProgress}}
- **{{examName}}**: {{completionPercentage}}% completed.
  {{#if revisionTopicsJoined}}
  - Topics marked for revision: {{revisionTopicsJoined}}
  {{/if}}
{{/each}}

**Instructions:**
1.  Identify 1-2 clear weaknesses based on low scores and recurring incorrectly answered topics.
2.  Identify topics marked for revision that the student should prioritize.
3.  Generate 3-4 concise, actionable suggestions in a Markdown list.
4.  For each suggestion, provide a direct link to the relevant practice page. The URL format is \`/practice?topic=EXAM_TOPIC\`. Make sure to URL-encode the topic. For example, a suggestion for "Indian Polity" in the "UPSC Civil Services" exam should have a link like: \`[Practice Indian Polity](/practice?topic=UPSC%20Civil%20Services%20-%20Indian%20Polity)\`.
5.  Keep the tone encouraging and motivating. Start with a positive affirmation.
`,
});


const generateStudySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateStudySuggestionsFlow',
    inputSchema: GenerateStudySuggestionsInputSchema,
    outputSchema: GenerateStudySuggestionsOutputSchema,
  },
  async (input: GenerateStudySuggestionsInput) => {
    // Preprocess arrays to joined strings for template
    const processedInput = {
      ...input,
      recentExams: input.recentExams.map((e) => ({
        ...e,
        incorrectlyAnsweredTopicsJoined: (e.incorrectlyAnsweredTopics || []).join(', ')
      })),
      syllabusProgress: input.syllabusProgress.map((s) => ({
        ...s,
        revisionTopicsJoined: (s.revisionTopics || []).join(', ')
      })),
    };
    const {output} = await prompt(processedInput);
    if (!output) {
      throw new Error('Failed to generate study suggestions: output is null or undefined.');
    }
    return output;
  }
);

