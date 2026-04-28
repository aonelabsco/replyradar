'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Stage = 'idle' | 'loading' | 'review' | 'editing' | 'approved';

interface ApprovedItem {
  id: string;
  originalTweet: string;
  reply: string;
  status: string;
  tweetUrl: string | null;
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
  const [tweetUrl, setTweetUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [generatedReply, setGeneratedReply] = useState('');
  const [rejectedReplies, setRejectedReplies] = useState<string[]>([]);
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

  // Auto-generate when arriving from the bookmarklet (?text=...&tweetUrl=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const text = urlParams.get('text')?.trim();
    const url = urlParams.get('tweetUrl')?.trim();
    if (url) setTweetUrl(url);
    if (text) {
      setTweetText(text);
      runGenerate(text, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runGenerate(text: string, rejected: string[]) {
    setError('');
    setStage('loading');
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText: text, rejectedReplies: rejected }),
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
    await runGenerate(tweetText, rejectedReplies);
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
        tweetUrl: tweetUrl || undefined,
      }),
    }).catch(() => {});
    setGeneratedReply(replyToSave);
    setStage('approved');
    setHistory((prev) => [
      { id: Date.now().toString(), originalTweet: tweetText, reply: replyToSave, status: wasEdited ? 'edited' : 'approved', tweetUrl: tweetUrl || null, createdAt: 'just now' },
      ...prev.slice(0, 9),
    ]);
  }

  async function handleReject() {
    const rejected = [...rejectedReplies, generatedReply];
    await fetch('/api/approve-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalTweet: tweetText,
        reply: generatedReply,
        status: 'rejected',
        tweetUrl: tweetUrl || undefined,
      }),
    }).catch(() => {});
    setRejectedReplies(rejected);
    // Immediately try again with the rejected reply as context
    await runGenerate(tweetText, rejected);
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
    setTweetUrl('');
    setGeneratedReply('');
    setRejectedReplies([]);
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

          {tweetUrl && (
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-amber-500 transition-colors truncate -mt-2">
              ↗ {tweetUrl}
            </a>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {stage === 'idle' && (
            <button
              type="submit"
              disabled={!tweetText.trim()}
              className="self-start px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {rejectedReplies.length > 0 ? 'Try another' : 'Generate reply'}
            </button>
          )}

          {stage === 'loading' && (
            <p className="text-sm text-gray-400 animate-pulse">
              {rejectedReplies.length > 0 ? 'Generating a fresh option...' : 'Generating...'}
            </p>
          )}
        </form>
      )}

      {/* Review stage */}
      {stage === 'review' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Generated reply</p>
            {rejectedReplies.length > 0 && (
              <p className="text-xs text-gray-300">{rejectedReplies.length} rejected</p>
            )}
          </div>
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
              Reject & try again
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
          {tweetUrl && (
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors mb-3 block">
              ↗ Go back to tweet to post your reply
            </a>
          )}
          <p className="text-xs text-gray-400 mb-4">Reply saved — it'll improve future suggestions.</p>
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
    if (!show || !linkRef.current) return;
    const appUrl = window.location.origin;
    const code = `javascript:(function(){` +
      `var text='';` +
      `try{` +
        `var parts=window.location.pathname.split('/');` +
        `if(parts[2]==='status'){` +
          `var uname='/'+parts[1].toLowerCase();` +
          `var arts=document.querySelectorAll('article');` +
          `for(var i=0;i<arts.length;i++){` +
            `var links=arts[i].querySelectorAll('a[href]');` +
            `var found=false;` +
            `for(var j=0;j<links.length;j++){` +
              `try{if(new URL(links[j].href).pathname.toLowerCase()===uname){found=true;break;}}catch(e){}` +
            `}` +
            `if(found){` +
              `var el=arts[i].querySelector('[data-testid="tweetText"]');` +
              `if(el){text=el.innerText.trim();break;}` +
            `}` +
          `}` +
        `}` +
      `}catch(e){}` +
      `if(!text)text=window.getSelection().toString().trim();` +
      `if(!text){alert('Could not detect tweet. Open the tweet detail page (click the tweet so the URL is x.com/user/status/ID), then try again.');return;}` +
      `window.open('${appUrl}/quick?text='+encodeURIComponent(text)+'&tweetUrl='+encodeURIComponent(window.location.href),'_blank');` +
      `})();`;
    linkRef.current.setAttribute('href', code);
  }, [show]);

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
            Drag the button below to your bookmarks bar. On any tweet page on X, click it — ReplyRadar opens in a new tab with the tweet already filled in, so you don&apos;t lose your place.
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
          {item.status === 'edited' && (
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
      {item.tweetUrl && (
        <a href={item.tweetUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-gray-300 hover:text-amber-500 transition-colors mt-1 block truncate">
          ↗ {item.tweetUrl}
        </a>
      )}
    </div>
  );
}
