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

  // Fetch style examples from the library
  const db = getDb();
  const snap = await db.collection('myContent').orderBy('createdAt', 'desc').limit(30).get();
  const examples = snap.docs.map((doc) => {
    const d = doc.data();
    return `[${d.type}] ${d.content as string}`;
  });

  const styleContext = examples.length > 0
    ? examples.join('\n\n')
    : 'No style examples available yet — use your natural voice.';

  const systemPrompt = `You are a ghostwriter who crafts tweet replies in the exact voice and style of the user based on their past writing samples.

## User's writing samples
${styleContext}

## Instructions
Study the samples carefully — notice vocabulary choices, sentence length, punctuation habits, tone, use of humor or directness, and how the user typically engages. Then write a reply to the tweet provided that sounds authentically like them.

Rules:
- Match the user's voice exactly, not generic tweet style
- Keep replies concise (under 280 characters unless the content genuinely requires more)
- Be conversational and genuine — avoid corporate or formal language
- Generate exactly 3 distinct reply options, separated by "---"
- Do not number them or add labels
- Do not add any explanation before or after the replies`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
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
          content: `Write 3 reply options for this tweet:\n\n${tweetText.trim()}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.type === 'text' ? textBlock.text : '';

    const replies = raw
      .split('---')
      .map((r) => r.trim())
      .filter(Boolean);

    return NextResponse.json({ replies });
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
