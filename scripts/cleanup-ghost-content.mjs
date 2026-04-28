// Deletes myContent docs that were ghost-written by approve-reply.
// Safe to delete: these have auto-generated IDs (no 'tweet_' prefix) and
// no likes/engagements fields — meaning they came from approve-reply, not CSV import.
// CSV-imported docs always have IDs like tweet_<postId>.
// Manually-added docs also lack a tweet_ prefix but they'll have been very few.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load .env.local manually with proper quote-stripping
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of env.split('\n')) {
  const eqIdx = line.indexOf('=');
  if (eqIdx < 1) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  // Convert literal \n sequences to real newlines (for private keys)
  val = val.replace(/\\n/g, '\n');
  process.env[key] = val;
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const snap = await db.collection('myContent').get();
const ghosts = snap.docs.filter((doc) => !doc.id.startsWith('tweet_'));

console.log(`Total myContent docs: ${snap.size}`);
console.log(`Docs with tweet_ prefix (CSV imports): ${snap.size - ghosts.length}`);
console.log(`Docs without tweet_ prefix (ghosts + manual adds): ${ghosts.length}`);

if (ghosts.length === 0) {
  console.log('Nothing to delete.');
  process.exit(0);
}

console.log('\nSample of docs to delete:');
ghosts.slice(0, 5).forEach((doc) => {
  const d = doc.data();
  console.log(`  [${doc.id}] ${String(d.content).slice(0, 60)}...`);
});

// Delete in batches of 500
let deleted = 0;
for (let i = 0; i < ghosts.length; i += 500) {
  const batch = db.batch();
  for (const doc of ghosts.slice(i, i + 500)) batch.delete(doc.ref);
  await batch.commit();
  deleted += ghosts.slice(i, i + 500).length;
  console.log(`\nDeleted ${deleted}/${ghosts.length}`);
}

const after = await db.collection('myContent').count().get();
console.log(`\nDone. myContent now has ${after.data().count} docs.`);
