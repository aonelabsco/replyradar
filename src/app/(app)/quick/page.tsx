'use client';

import { useState } from 'react';

export default function QuickPage() {
  const [tweetUrl, setTweetUrl] = useState('');
  const [tweetText, setTweetText] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tweetText.trim()) return;
    setError('');
    setReplies([]);
    setLoading(true);
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText, tweetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setReplies(data.replies ?? []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#2B2B2B]">Quick reply</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Paste a tweet to get 3 reply suggestions in your voice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div>
          <label htmlFor="tweet-url" className="block text-sm font-medium text-[#2B2B2B] mb-1.5">
            Tweet URL <span className="text-gray-300 font-normal">(optional)</span>
          </label>
          <input
            id="tweet-url"
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/someone/status/..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-[#2B2B2B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="tweet-text" className="block text-sm font-medium text-[#2B2B2B] mb-1.5">
            Tweet content
          </label>
          <textarea
            id="tweet-text"
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="Paste the tweet text here..."
            rows={5}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-[#2B2B2B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !tweetText.trim()}
          className="self-start px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate replies'}
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="animate-pulse">Thinking in your voice...</span>
        </div>
      )}

      {replies.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reply options</p>
          {replies.map((reply, i) => (
            <div
              key={i}
              className="relative p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group"
            >
              <p className="text-sm text-[#2B2B2B] whitespace-pre-wrap pr-16">{reply}</p>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="text-xs text-gray-300">
                  {reply.length}/280
                </span>
                <button
                  onClick={() => handleCopy(reply, i)}
                  className="text-xs text-gray-300 hover:text-amber-500 transition-colors"
                >
                  {copied === i ? 'copied!' : 'copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
