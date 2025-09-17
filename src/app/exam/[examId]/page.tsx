
import { examCategories } from '@/lib/exam-categories';
import { ExamDetails } from '@/lib/types';
import ExamPageClient from './ExamPageClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    const allExams = examCategories.flatMap(category => category.exams);
    return allExams.map(exam => ({
        examId: exam.examId,
    }));
}

function getExam(examId: string): ExamDetails | undefined {
    const allExams = examCategories.flatMap(c => c.exams);
    return allExams.find(e => e.examId === examId);
}

export default function ExamSyllabusPage({ params }: { params: { examId: string } }) {
  const { examId } = params;
  const exam = getExam(examId);

  if (!exam) {
    notFound();
  }

  return <ExamPageClient exam={exam} />;
}
