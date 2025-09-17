
import { db } from '@/lib/firebase';
import { SyllabusProgress } from '@/lib/types';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';

const getSyllabusProgressDocRef = (userId: string, examId: string) => {
    return doc(db, 'users', userId, 'syllabusProgress', examId);
}

export async function getSyllabusProgress(userId: string, examId: string): Promise<SyllabusProgress | null> {
    const docRef = getSyllabusProgressDocRef(userId, examId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as SyllabusProgress;
    } else {
        return null;
    }
}

export async function getAllSyllabusProgress(userId: string): Promise<Record<string, SyllabusProgress>> {
    const progressCollectionRef = collection(db, 'users', userId, 'syllabusProgress');
    const querySnapshot = await getDocs(progressCollectionRef);
    const allProgress: Record<string, SyllabusProgress> = {};
    querySnapshot.forEach((doc) => {
        allProgress[doc.id] = doc.data() as SyllabusProgress;
    });
    return allProgress;
}


export async function updateSyllabusProgress(userId: string, examId: string, progress: SyllabusProgress): Promise<void> {
    const docRef = getSyllabusProgressDocRef(userId, examId);
    await setDoc(docRef, progress, { merge: true });
}
