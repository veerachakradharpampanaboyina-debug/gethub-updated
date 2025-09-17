'use server';
/**
 * @fileOverview Auto-grades objective questions from a student's exam.
 *
 * - autoGradeObjectiveQuestions - A function that grades the exam.
 * - AutoGradeObjectiveQuestionsInput - The input type for the autoGradeObjectiveQuestions function.
 * - AutoGradeObjectiveQuestionsOutput - The return type for the autoGradeObjectiveQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoGradeObjectiveQuestionsInputSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string().describe('The unique identifier for the question.'),
      questionType: z
        .enum(['multipleChoice', 'trueFalse'])
        .describe('The type of objective question.'),
      questionText: z.string().describe('The text of the question.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
      studentAnswer: z.string().describe('The student\u2019s answer to the question.'),
      pointsPossible: z.number().describe('The points possible for the question.'),
    })
  ).describe('An array of questions to grade.'),
});
export type AutoGradeObjectiveQuestionsInput = z.infer<typeof AutoGradeObjectiveQuestionsInputSchema>;

const AutoGradeObjectiveQuestionsOutputSchema = z.object({
  results: z.array(
    z.object({
      questionId: z.string().describe('The unique identifier for the question.'),
      isCorrect: z.boolean().describe('Whether the student answered correctly.'),
      pointsAwarded: z.number().describe('The points awarded to the student for the question.'),
      feedback: z.string().describe('Feedback on the student\u2019s answer.'),
    })
  ).describe('An array of results for each question.'),
  totalPointsPossible: z.number().describe('The total possible points for all questions.'),
  totalPointsAwarded: z.number().describe('The total points awarded to the student.'),
});
export type AutoGradeObjectiveQuestionsOutput = z.infer<typeof AutoGradeObjectiveQuestionsOutputSchema>;

export async function autoGradeObjectiveQuestions(input: AutoGradeObjectiveQuestionsInput): Promise<AutoGradeObjectiveQuestionsOutput> {
  return autoGradeObjectiveQuestionsFlow(input);
}

const autoGradePrompt = ai.definePrompt({
  name: 'autoGradeObjectiveQuestionsPrompt',
  input: {schema: AutoGradeObjectiveQuestionsInputSchema},
  output: {schema: AutoGradeObjectiveQuestionsOutputSchema},
  prompt: `You are an AI assistant grading objective questions on a student's exam. 

  Evaluate the student's answers and determine if they are correct. Award points accordingly.
  Provide feedback for each question.

  Here are the questions and answers to grade:
  {{#each questions}}
  Question ID: {{questionId}}
  Question Type: {{questionType}}
  Question Text: {{questionText}}
  Correct Answer: {{correctAnswer}}
  Student Answer: {{studentAnswer}}
  Points Possible: {{pointsPossible}}
  {{/each}}

  Return the results in the following JSON format:
  {{output}}
  `,
});

const autoGradeObjectiveQuestionsFlow = ai.defineFlow(
  {
    name: 'autoGradeObjectiveQuestionsFlow',
    inputSchema: AutoGradeObjectiveQuestionsInputSchema,
    outputSchema: AutoGradeObjectiveQuestionsOutputSchema,
  },
  async input => {
    let totalPointsPossible = 0;
    let totalPointsAwarded = 0;
    const results: AutoGradeObjectiveQuestionsOutput["results"] = [];

    for (const question of input.questions) {
      totalPointsPossible += question.pointsPossible;
      const isCorrect = question.studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      const pointsAwarded = isCorrect ? question.pointsPossible : 0;
      totalPointsAwarded += pointsAwarded;

      results.push({
        questionId: question.questionId,
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        feedback: isCorrect ? 'Correct!' : 'Incorrect. The correct answer is ' + question.correctAnswer,
      });
    }

    const output: AutoGradeObjectiveQuestionsOutput = {
      results: results,
      totalPointsPossible: totalPointsPossible,
      totalPointsAwarded: totalPointsAwarded,
    };
    return output;
    //const {output} = await autoGradePrompt(input);
    //return output!;
  }
);
