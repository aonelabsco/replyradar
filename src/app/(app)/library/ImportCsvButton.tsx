'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportCsvButton() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const router = useRouter();

  async function handleImport() {
    if (!csv.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error ?? 'Import failed');
        return;
      }
      setResult(`Imported ${data.imported} tweet${data.imported === 1 ? '' : 's'}`);
      setCsv('');
      router.refresh();
    } catch {
      setResult('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 ml-2 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-500 hover:text-[#2B2B2B] hover:border-gray-300 transition-colors"
      >
        Import CSV
      </button>
    );
  }

  return (
    <div className="mb-8 p-4 border border-gray-200 rounded-xl flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-[#2B2B2B] mb-1">Paste your X/Twitter analytics CSV</p>
        <p className="text-xs text-gray-400">
          Export from X Analytics → copy the full file content and paste below.
          Only tweets with text content will be imported.
        </p>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="Post id&#9;Date&#9;Post text&#9;Post Link&#9;Impressions..."
        rows={6}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none font-mono"
      />

      {result && (
        <p className={`text-sm ${result.startsWith('Imported') ? 'text-green-600' : 'text-red-500'}`}>
          {result}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={loading || !csv.trim()}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setResult(''); setCsv(''); }}
          className="px-4 py-1.5 text-sm text-gray-400 hover:text-[#2B2B2B] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
