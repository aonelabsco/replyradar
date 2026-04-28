'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Stage = 'idle' | 'loading' | 'review' | 'editing' | 'approved';

interface ApprovedItem {
  id: string;
  originalTweet: string;
  reply: string;
  edited: boolean;
  createdAt: string;
}

export default function QuickPage() {
  return (
    <Suspense>
      <QuickPageInner />
    </Suspense>
  );
}

function QuickPageInner() {
  const params = useSearchParams();

  const [tweetText, setTweetText] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [generatedReply, setGeneratedReply] = useState('');
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ApprovedItem[]>([]);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/approve-reply')
      .then((r) => r.json())
      .then((d) => setHistory(d.items ?? []))
      .catch(() => {});
  }, []);

  // Auto-generate when arriving from the bookmarklet (?text=...)
  useEffect(() => {
    const text = params.get('text')?.trim();
    if (text) {
      setTweetText(text);
      runGenerate(text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runGenerate(text: string) {
    setError('');
    setStage('loading');
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed'); setStage('idle'); return; }
      setGeneratedReply(data.reply ?? '');
      setStage('review');
    } catch {
      setError('Network error');
      setStage('idle');
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!tweetText.trim()) return;
    await runGenerate(tweetText);
  }

  async function handleApprove(replyToSave: string, wasEdited = false) {
    await fetch('/api/approve-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalTweet: tweetText,
        reply: replyToSave,
        edited: wasEdited,
        originalReply: wasEdited ? generatedReply : undefined,
      }),
    }).catch(() => {});
    setGeneratedReply(replyToSave);
    setStage('approved');
    setHistory((prev) => [
      { id: Date.now().toString(), originalTweet: tweetText, reply: replyToSave, edited: wasEdited, createdAt: 'just now' },
      ...prev.slice(0, 9),
    ]);
  }

  function handleReject() {
    setGeneratedReply('');
    setStage('idle');
  }

  function handleEdit() {
    setEditText(generatedReply);
    setStage('editing');
    setTimeout(() => editRef.current?.focus(), 50);
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return;
    await handleApprove(editText.trim(), true);
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleAnother() {
    setTweetText('');
    setGeneratedReply('');
    setEditText('');
    setError('');
    setStage('idle');
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#2B2B2B]">Quick reply</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Paste a tweet to get a reply suggestion in your voice.
        </p>
      </div>

      {/* Input form — always visible unless approved */}
      {stage !== 'approved' && (
        <form onSubmit={handleGenerate} className="flex flex-col gap-4 mb-8">
          <div>
            <label htmlFor="tweet-text" className="block text-sm font-medium text-[#2B2B2B] mb-1.5">
              Tweet content
            </label>
            <textarea
              id="tweet-text"
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Paste the tweet you want to reply to..."
              rows={5}
              required
              disabled={stage === 'loading' || stage === 'review' || stage === 'editing'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-[#2B2B2B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none disabled:opacity-60"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {stage === 'idle' && (
            <button
              type="submit"
              disabled={!tweetText.trim()}
              className="self-start px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Generate reply
            </button>
          )}

          {stage === 'loading' && (
            <p className="text-sm text-gray-400 animate-pulse">Generating...</p>
          )}
        </form>
      )}

      {/* Review stage */}
      {stage === 'review' && (
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Generated reply</p>
          <div className="p-4 border border-gray-200 rounded-xl bg-white mb-4">
            <p className="text-sm text-[#2B2B2B] whitespace-pre-wrap">{generatedReply}</p>
            <p className="text-xs text-gray-300 mt-2">{generatedReply.length}/280</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(generatedReply)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Approve
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-[#2B2B2B] text-sm font-medium rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Edit stage */}
      {stage === 'editing' && (
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Edit reply</p>
          <textarea
            ref={editRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-amber-400 rounded-xl bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none mb-3"
          />
          <p className="text-xs text-gray-300 mb-3">{editText.length}/280</p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editText.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save edit
            </button>
            <button
              onClick={() => setStage('review')}
              className="px-4 py-2 text-sm text-gray-400 hover:text-[#2B2B2B] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Approved stage */}
      {stage === 'approved' && (
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Saved reply</p>
          <div className="p-4 border border-green-100 bg-green-50 rounded-xl mb-4">
            <p className="text-sm text-[#2B2B2B] whitespace-pre-wrap pr-16">{generatedReply}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-300">{generatedReply.length}/280</p>
              <button
                onClick={() => handleCopy(generatedReply)}
                className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">Reply saved to your library — it'll improve future suggestions.</p>
          <button
            onClick={handleAnother}
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-[#2B2B2B] text-sm font-medium rounded-lg transition-colors"
          >
            Reply to another tweet
          </button>
        </div>
      )}

      {/* Bookmarklet */}
      <BookmarkletTip />

      {/* Recent approved replies */}
      {history.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent saved replies</p>
          <div className="flex flex-col gap-2">
            {history.map((item) => (
              <RecentReply key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookmarkletTip() {
  const [show, setShow] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!linkRef.current) return;
    const appUrl = window.location.origin;
    // Use location.href (not window.open) to avoid popup blockers.
    // Falls back to window.getSelection() if the data-testid selector misses.
    const code = `javascript:(function(){` +
      `var el=document.querySelector('[data-testid="tweetText"]');` +
      `var text=el?el.innerText.trim():window.getSelection().toString().trim();` +
      `if(!text){alert('No tweet text found. Try selecting the tweet text first, then clicking the bookmarklet.');return;}` +
      `window.location.href='${appUrl}/quick?text='+encodeURIComponent(text);` +
      `})();`;
    // Set via DOM to bypass React's javascript: href sanitization
    linkRef.current.setAttribute('href', code);
  }, []);

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <button
        onClick={() => setShow((s) => !s)}
        className="text-xs text-gray-400 hover:text-[#2B2B2B] transition-colors"
      >
        {show ? '▾' : '▸'} Send tweets from X directly to this page
      </button>
      {show && (
        <div className="mt-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
          <p className="text-sm text-[#2B2B2B] font-medium mb-1">Browser bookmarklet</p>
          <p className="text-xs text-gray-400 mb-3">
            Drag the button below to your bookmarks bar. On any tweet page on X, click it — this page opens with the tweet already filled in.
            <br />
            <span className="text-gray-300">If it doesn't detect the tweet, select the tweet text first, then click the bookmarklet.</span>
          </p>
          <a
            ref={linkRef}
            href="#"
            onClick={(e) => e.preventDefault()}
            draggable
            className="inline-block px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg cursor-grab active:cursor-grabbing select-none"
          >
            ↩ Reply with ReplyRadar
          </a>
          <p className="text-xs text-gray-300 mt-2">Drag to your bookmarks bar — clicking here does nothing.</p>
        </div>
      )}
    </div>
  );
}

function RecentReply({ item }: { item: ApprovedItem }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(item.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group">
      {item.originalTweet && (
        <p className="text-xs text-gray-300 mb-1 line-clamp-1">↩ {item.originalTweet}</p>
      )}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#2B2B2B]">{item.reply}</p>
        <div className="flex items-center gap-2 shrink-0">
          {item.edited && (
            <span className="text-xs text-amber-500">edited</span>
          )}
          <span className="text-xs text-gray-300">{item.createdAt}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? 'copied!' : 'copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
