import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/firebase';

const client = new Anthropic();

// Sort myContent by engagement score (likes + engagements), highest first.
// Docs without engagement data (manually added) get score 0 but are still included.
function scoreDoc(d: FirebaseFirestore.DocumentData): number {
  return (d.likes ?? 0) + (d.engagements ?? 0);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { tweetText, rejectedReplies } = body as { tweetText?: string; rejectedReplies?: string[] };
  if (!tweetText?.trim()) {
    return NextResponse.json({ error: 'tweetText is required' }, { status: 400 });
  }

  const db = getDb();

  // Fetch style examples and approved replies in parallel
  const [contentSnap, approvedSnap] = await Promise.all([
    db.collection('myContent').limit(150).get().catch(() => null),
    db.collection('approvedReplies').orderBy('createdAt', 'desc').limit(15).get().catch(() => null),
  ]);

  // Build engagement-sorted examples — top 30 by likes+engagements
  let styleContext = '(no examples yet)';
  if (contentSnap && !contentSnap.empty) {
    const sorted = contentSnap.docs
      .map((doc) => ({ data: doc.data(), score: scoreDoc(doc.data()) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    styleContext = sorted
      .map(({ data: d, score }) => {
        const perf = score > 0 ? ` [${score} engagements]` : '';
        return `${d.content as string}${perf}`;
      })
      .join('\n\n');
  }

  // Approved replies = tweets the user has actually sent through this tool
  let approvedContext = '(none yet)';
  if (approvedSnap && !approvedSnap.empty) {
    approvedContext = approvedSnap.docs
      .map((doc) => {
        const d = doc.data();
        const edited = d.edited ? ' [user edited this]' : '';
        const ctx = d.originalTweet ? `\nIn reply to: "${(d.originalTweet as string).slice(0, 120)}"` : '';
        return `Reply: "${d.reply as string}"${edited}${ctx}`;
      })
      .join('\n\n');
  }

  const systemPrompt = `You are a ghostwriter for a tech founder building in the AI/agents space on X (Twitter). Your job is to write ONE reply that sounds exactly like them — not like an AI, not like a generic tweet.

## Who they are
- Building in AI/agents space, early adopter, follows the ecosystem closely (Claude, Anthropic, OpenClaw, Hermes, Paperclip, Cursor, etc.)
- Witty, self-aware, slightly self-deprecating, genuine
- Has a small but growing account and is unafraid to make fun of that fact
- Thinks carefully about AI, agents, distribution, and how tech actually works for non-technical people

## Voice rules — non-negotiable
1. Always lowercase — first word of sentence, "i" for first person, everything
2. Short — almost never more than 2 sentences, often just 1 or a fragment
3. Dry wit — the joke comes from subverting the original tweet's framing, not from explaining it
4. If it's a punchline, end there. Never over-explain.
5. Direct questions when genuinely curious — asks things plainly, doesn't hedge
6. Occasional emoji (😂 🤣 🙈 😅 🤔) but rarely, never decoratively
7. Never: "absolutely", "certainly", "great point", "100%", "love this", or any corporate filler
8. Sometimes the best reply is very short: a single observation, a flipped word, a question
9. Makes tech/AI references naturally — can name specific tools, models, concepts without explaining them
10. Light self-deprecation is fine; punching up (at big accounts, trends) is fine; punching down is not

## Their writing samples (sorted by what actually resonated — higher engagement first)
${styleContext}

## Replies they've actually approved and sent (study these especially closely — these are confirmed on-brand)
${approvedContext}

## Output
Write exactly ONE reply. Output only the reply text — no quotes around it, no explanation before or after, no "Here's a reply:" preamble. Just the reply.`;

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
          content: rejectedReplies && rejectedReplies.length > 0
            ? `Write a reply for this tweet:\n\n${tweetText.trim()}\n\nPreviously rejected — do not repeat or be similar to these:\n${rejectedReplies.map((r) => `- "${r}"`).join('\n')}`
            : `Write a reply for this tweet:\n\n${tweetText.trim()}`,
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
