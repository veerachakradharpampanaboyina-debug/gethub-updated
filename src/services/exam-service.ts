

import { db } from '@/lib/firebase';
import { ExamAttempt, Question } from '@/lib/types';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

const attemptsCollection = collection(db, 'examAttempts');


export async function saveExamAttempt(attempt: Omit<ExamAttempt, 'id' | 'createdAt'>): Promise<string> {
    const attemptWithTimestamp = {
        ...attempt,
        createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(attemptsCollection, attemptWithTimestamp);
    return docRef.id;
}


export async function getUserExamAttempts(userId: string): Promise<ExamAttempt[]> {
    const q = query(attemptsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const attempts: ExamAttempt[] = [];
    querySnapshot.forEach((doc) => {
        attempts.push({ id: doc.id, ...doc.data() } as ExamAttempt);
    });
    return attempts;
}


export async function getSeenQuestions(userId: string): Promise<string[]> {
    const attempts = await getUserExamAttempts(userId);
    const seenQuestions = new Set<string>();
    attempts.forEach(attempt => {
        if (attempt.examId && attempt.examId.startsWith('practice-')) {
            attempt.questions.forEach((q: any) => seenQuestions.add(q.questionText));
        }
    });
    return Array.from(seenQuestions);
}
