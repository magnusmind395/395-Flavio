import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCTEZOOpmmtrKXSJ3A5cAD49xD9Fa0OD9A',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'magnusmind-d42ec.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'magnusmind-d42ec',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'magnusmind-d42ec.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '981919789399',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:981919789399:web:46f31e0ad8e164f54e8e12',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
