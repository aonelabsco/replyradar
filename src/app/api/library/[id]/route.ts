import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getDb();
  await db.collection('myContent').doc(id).delete();
  return NextResponse.json({ ok: true });
}
