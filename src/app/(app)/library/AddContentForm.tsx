'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddContentForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'tweet' | 'article'>('tweet');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, url }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setContent('');
      setUrl('');
      setType('tweet');
      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-500 hover:text-[#2B2B2B] hover:border-gray-300 transition-colors"
      >
        + Add content
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 p-4 border border-gray-200 rounded-xl flex flex-col gap-3"
    >
      {/* Type toggle */}
      <div className="flex gap-2">
        {(['tweet', 'article'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              type === t
                ? 'bg-[#2B2B2B] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (optional)"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={type === 'tweet' ? 'Paste tweet text...' : 'Paste article excerpt or summary...'}
        rows={4}
        required
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(''); }}
          className="px-4 py-1.5 text-sm text-gray-400 hover:text-[#2B2B2B] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
