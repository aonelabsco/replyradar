import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const PURE_URL_RE = /^https?:\/\/\S+$/;

interface CsvRow {
  postId: string;
  content: string;
  url: string | null;
  likes: number;
  engagements: number;
}

// Parse a single CSV line respecting quoted fields
function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

function parseFile(raw: string): CsvRow[] {
  // Strip UTF-8 BOM, normalize all line endings to \n
  const normalized = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Auto-detect separator from the header row
  const header = lines[0];
  const sep = header.includes('\t') ? 'tab' : 'comma';

  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = sep === 'tab' ? lines[i].split('\t') : splitCsvLine(lines[i]);
    if (cols.length < 7) continue;

    const postId = cols[0].trim().replace(/^"(.*)"$/, '$1');
    const text = cols[2].trim().replace(/^"(.*)"$/, '$1');
    const link = cols[3].trim().replace(/^"(.*)"$/, '$1');
    const likes = parseInt(cols[5], 10) || 0;
    const engagements = parseInt(cols[6], 10) || 0;

    if (!postId || !text) continue;
    if (link.includes('/undefined')) continue;
    if (PURE_URL_RE.test(text)) continue;

    results.push({ postId, content: text, url: link || null, likes, engagements });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.csv) return NextResponse.json({ error: 'csv field required' }, { status: 400 });

  const rows = parseFile(body.csv as string);
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, error: 'No valid rows found. Make sure you are uploading the X Analytics tweet export file.' });
  }

  const db = getDb();
  const col = db.collection('myContent');

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
          likes: row.likes,
          engagements: row.engagements,
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
