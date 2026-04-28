import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { originalTweet, reply, edited, originalReply } = body as {
    originalTweet?: string;
    reply?: string;
    edited?: boolean;
    originalReply?: string;
  };

  if (!reply?.trim()) return NextResponse.json({ error: 'reply is required' }, { status: 400 });

  const db = getDb();
  const now = FieldValue.serverTimestamp();

  // Store in approvedReplies for history/display
  await db.collection('approvedReplies').add({
    originalTweet: originalTweet?.trim() ?? '',
    reply: reply.trim(),
    edited: edited ?? false,
    originalReply: edited ? (originalReply?.trim() ?? '') : null,
    createdAt: now,
  });

  // Add the reply to myContent so future generations learn from it
  await db.collection('myContent').add({
    type: 'tweet',
    content: reply.trim(),
    url: null,
    createdAt: now,
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const db = getDb();
  const snap = await db
    .collection('approvedReplies')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const items = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      originalTweet: d.originalTweet as string,
      reply: d.reply as string,
      edited: d.edited as boolean,
      createdAt: d.createdAt?.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      }) ?? '—',
    };
  });

  return NextResponse.json({ items });
}
