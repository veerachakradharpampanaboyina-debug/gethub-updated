
import { db, storage } from '@/lib/firebase';
import { GalleryItem } from '@/lib/types';
import { collection, addDoc, getDocs, query, Timestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const galleryCollection = collection(db, 'galleryItems');

export async function addGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<string> {
    const itemWithTimestamp = {
        ...item,
        createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(galleryCollection, itemWithTimestamp);
    return docRef.id;
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
    const q = query(galleryCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items: GalleryItem[] = [];
    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as GalleryItem);
    });
    return items;
}

export async function uploadGalleryImage(file: File): Promise<string> {
    if (!file) {
      return Promise.reject(new Error('No file provided.'));
    }
    const storageRef = ref(storage, `gallery_images/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}
