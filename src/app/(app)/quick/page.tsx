'use client';

import { useState } from 'react';

export default function QuickPage() {
  const [tweetUrl, setTweetUrl] = useState('');
  const [tweetText, setTweetText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No-op for now — AI reply generation coming in phase 4
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#2B2B2B] mb-1">Quick reply</h1>
      <p className="text-sm text-gray-400 mb-8">
        Paste a tweet to get reply suggestions. Single-tweet mode coming in phase 4.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="tweet-url" className="block text-sm font-medium text-[#2B2B2B] mb-1.5">
            Tweet URL
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
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-[#2B2B2B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled
          className="self-start px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg opacity-40 cursor-not-allowed"
          title="Coming in phase 4"
        >
          Generate replies
        </button>
      </form>
    </div>
  );
}
