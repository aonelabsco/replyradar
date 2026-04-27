import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const PURE_URL_RE = /^https?:\/\/\S+$/;

function parseTsv(raw: string): Array<{ content: string; url: string | null }> {
  const lines = raw.split('\n');
  const results: Array<{ content: string; url: string | null }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 4) continue;

    const postId = cols[0].trim();
    const text = cols[2].trim();
    const link = cols[3].trim();

    // Skip rows with no post id or undefined url (malformed rows)
    if (!postId || link.includes('/undefined')) continue;

    // Skip empty or pure-URL content (media-only tweets)
    if (!text || PURE_URL_RE.test(text)) continue;

    results.push({
      content: text,
      url: link || null,
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.csv) return NextResponse.json({ error: 'csv field required' }, { status: 400 });

  const rows = parseTsv(body.csv as string);
  if (rows.length === 0) return NextResponse.json({ imported: 0 });

  const db = getDb();
  const col = db.collection('myContent');

  // Firestore batch limit is 500
  let imported = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 500)) {
      batch.set(col.doc(), {
        type: 'tweet',
        content: row.content,
        url: row.url,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    imported += rows.slice(i, i + 500).length;
  }

  return NextResponse.json({ imported });
}
