
import { config } from 'dotenv';
config();

import '@/ai/flows/auto-grade-objective-questions.ts';
import '@/ai/flows/generate-exam-summary.ts';
import '@/ai/flows/flag-potentially-incorrect-answers.ts';
import '@/ai/flows/generate-practice-exam.ts';
import '@/ai/flows/generate-syllabus-notes.ts';
import '@/ai/flows/generate-communication-feedback.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/generate-study-suggestions.ts';


