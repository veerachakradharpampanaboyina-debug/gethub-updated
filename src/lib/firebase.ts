
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  "projectId": "gradeal-9jnsz",
  "appId": "1:60815705674:web:ad4f748e1687eb1f1848b3",
  "storageBucket": "gradeal-9jnsz.appspot.com",
  "apiKey": "AIzaSyAGPGn89XExnW0kvtgsup4VErQ0Zxl07ao",
  "authDomain": "gradeal-9jnsz.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "60815705674"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Disable persistence to avoid "client is offline" errors in certain environments
const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});
const storage = getStorage(app);

export { app, auth, db, storage };
