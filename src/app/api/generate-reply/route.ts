import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/firebase';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { tweetText } = body as { tweetText?: string };
  if (!tweetText?.trim()) {
    return NextResponse.json({ error: 'tweetText is required' }, { status: 400 });
  }

  // Fetch style examples from the library (non-fatal if Firestore fails)
  let styleContext = 'No style examples available yet — use your natural voice.';
  try {
    const db = getDb();
    const snap = await db.collection('myContent').orderBy('createdAt', 'desc').limit(40).get();
    if (!snap.empty) {
      styleContext = snap.docs
        .map((doc) => {
          const d = doc.data();
          return `[${d.type}] ${d.content as string}`;
        })
        .join('\n\n');
    }
  } catch (dbErr) {
    console.error('Firestore fetch error:', dbErr);
  }

  const systemPrompt = `You are a ghostwriter who crafts tweet replies in the exact voice and style of the user based on their past writing samples.

## User's writing samples
${styleContext}

## Instructions
Study the samples carefully — notice vocabulary choices, sentence length, punctuation habits, tone, use of humor or directness, and how the user typically engages. Then write ONE reply to the tweet provided that sounds authentically like them.

Rules:
- Match the user's voice exactly — lowercase, punchy, direct, often witty or dry
- Keep the reply concise (under 280 characters unless genuinely needed)
- Be conversational and genuine — never corporate, never generic
- Output ONLY the reply text. No explanation, no preamble, no quotes around it.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Write a reply for this tweet:\n\n${tweetText.trim()}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const reply = textBlock?.type === 'text' ? textBlock.text.trim() : '';

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Claude API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
