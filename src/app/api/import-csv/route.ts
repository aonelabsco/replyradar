import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const PURE_URL_RE = /^https?:\/\/\S+$/;

interface CsvRow {
  postId: string;
  content: string;
  url: string | null;
}

function parseTsv(raw: string): CsvRow[] {
  const lines = raw.split('\n');
  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 4) continue;

    const postId = cols[0].trim();
    const text = cols[2].trim();
    const link = cols[3].trim();

    // Skip rows with no post id or malformed url (undefined)
    if (!postId || link.includes('/undefined')) continue;

    // Skip empty or pure-URL-only content (media-only tweets)
    if (!text || PURE_URL_RE.test(text)) continue;

    results.push({ postId, content: text, url: link || null });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.csv) return NextResponse.json({ error: 'csv field required' }, { status: 400 });

  const rows = parseTsv(body.csv as string);
  if (rows.length === 0) return NextResponse.json({ imported: 0, skipped: 0 });

  const db = getDb();
  const col = db.collection('myContent');

  // Use Post ID as doc ID — re-importing same CSV is idempotent
  let imported = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 500)) {
      batch.set(
        col.doc(`tweet_${row.postId}`),
        {
          type: 'tweet',
          content: row.content,
          url: row.url,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: false }
      );
    }
    await batch.commit();
    imported += rows.slice(i, i + 500).length;
  }

  return NextResponse.json({ imported });
}
