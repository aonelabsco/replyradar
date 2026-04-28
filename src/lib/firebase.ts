import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (_db) return _db;

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
      );
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  _db = getFirestore();
  return _db;
}
