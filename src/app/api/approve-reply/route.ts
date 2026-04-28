import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { originalTweet, reply, edited, originalReply, status } = body as {
    originalTweet?: string;
    reply?: string;
    edited?: boolean;
    originalReply?: string;
    status?: 'approved' | 'edited' | 'rejected';
  };

  if (!reply?.trim()) return NextResponse.json({ error: 'reply is required' }, { status: 400 });

  const resolvedStatus = status ?? (edited ? 'edited' : 'approved');
  const db = getDb();
  const now = FieldValue.serverTimestamp();

  await db.collection('approvedReplies').add({
    originalTweet: originalTweet?.trim() ?? '',
    reply: reply.trim(),
    status: resolvedStatus,
    originalReply: resolvedStatus === 'edited' ? (originalReply?.trim() ?? '') : null,
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
    const status = (d.status as string) ?? (d.edited ? 'edited' : 'approved');
    return {
      id: doc.id,
      originalTweet: d.originalTweet as string,
      reply: d.reply as string,
      status,
      createdAt: d.createdAt?.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      }) ?? '—',
    };
  });

  return NextResponse.json({ items });
}
