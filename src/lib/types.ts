
import type {
  AutoGradeObjectiveQuestionsOutput,
} from '@/ai/flows/auto-grade-objective-questions';
import type {
  FlagPotentiallyIncorrectAnswersOutput,
} from '@/ai/flows/flag-potentially-incorrect-answers';
import { z } from 'genkit';
import { Timestamp } from 'firebase/firestore';


export const GeneratedQuestionSchema = z.object({
  questionId: z.string().describe('A unique identifier for the question (e.g., "q1").'),
  questionType: z
    .enum(['multipleChoice', 'trueFalse', 'freeText'])
    .describe('The type of objective question.'),
  questionText: z.string().describe('The full text of the question.'),
  options: z.array(z.string()).optional().describe('An array of possible answers for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  pointsPossible: z.number().describe('The number of points the question is worth.'),
});


export interface Student {
  name: string;
  id: string;
  avatarUrl?: string;
}

export type QuestionType =
  | 'multipleChoice'
  | 'trueFalse'
  | 'matching'
  | 'freeText';

export interface Question extends z.infer<typeof GeneratedQuestionSchema> {
  studentAnswer: string;
  options?: string[]; // Ensure options is part of the final Question type
}

// New detailed syllabus structure
export interface ExamPaper {
  paperId: string;
  paperName: string;
  type: string;
  duration: string;
  totalMarks: number;
  totalQuestions?: number;
  negativeMarking?: string;
  qualifying?: boolean;
  qualifyingMarks?: string;
  notes?: string;
  topics?: string[];
  sections?: { sectionName: string; questions?: number; marks?: number; time?: string; topics?: string[] }[];
}

export interface PersonalityTest {
  stageName: string;
  totalMarks: number;
}

export interface ExamStage {
  stageId: string;
  stageName: string;
  papers: ExamPaper[];
  personalityTest?: PersonalityTest;
}

export interface ExamDetails {
  examId: string;
  examName: string;
  description: string;
  stages: ExamStage[];
  totalMarks?: number;
  totalStages?: number;
}

export interface Exam {
  student: Student;
  examName: string;
  examId: string;
  questions: Question[];
}

export type GradingResult = AutoGradeObjectiveQuestionsOutput['results'][0];

export type FlaggedAnswer = {
  questionId: string;
} & FlagPotentiallyIncorrectAnswersOutput;

export interface AIGradingState {
  objectiveResults: GradingResult[];
  flaggedAnswers: FlaggedAnswer[];
  summary: string;
  totalPointsAwarded: number;
  totalPointsPossible: number;
}

export interface ExamAttempt {
    id?: string;
    userId: string;
    examId: string;
    examName:string;
    questions: Question[];
    aiGradingState: AIGradingState;
    createdAt: Timestamp;
    incorrectlyAnsweredTopics?: string[];
}

export interface ScheduledExam {
    id?: string;
    examId: string; // Corresponds to ExamDetails.examId
    examName: string;
    questions: Question[];
    createdAt: Timestamp;
}

export interface GalleryItem {
    id?: string;
    studentName: string;
    achievement: string;
    photoURL: string;
    createdAt: Timestamp;
}

export type TopicStatus = 'Pending' | 'Completed' | 'Revision';

export interface SyllabusProgress {
    topicStatus: { [topicId: string]: TopicStatus };
}
