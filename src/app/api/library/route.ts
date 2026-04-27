import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { type, content, url } = body as { type?: string; content?: string; url?: string };

  if (!type || !['tweet', 'article'].includes(type)) {
    return NextResponse.json({ error: 'type must be tweet or article' }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const db = getDb();
  const ref = await db.collection('myContent').add({
    type,
    content: content.trim(),
    url: url?.trim() || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
