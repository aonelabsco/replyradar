'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportCsvButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult('');
    setLoading(true);
    try {
      const csv = await file.text();
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(data.error ?? 'Import failed'); return; }
      setResult(`Imported ${data.imported} tweet${data.imported === 1 ? '' : 's'} (duplicates skipped automatically)`);
      router.refresh();
    } catch {
      setResult('Failed to read file');
    } finally {
      setLoading(false);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
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
    <div className="mb-8 p-4 border border-gray-200 rounded-xl flex flex-col gap-3 w-full">
      <div>
        <p className="text-sm font-medium text-[#2B2B2B] mb-1">Import from X/Twitter analytics CSV</p>
        <p className="text-xs text-gray-400">
          Download your analytics export from X (x.com/i/account/analytics) and upload the file below.
          Re-uploading the same CSV is safe — duplicates are skipped automatically.
        </p>
      </div>

      <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${loading ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-amber-400'}`}>
        <span className="text-sm text-gray-500">
          {loading ? 'Importing...' : 'Choose CSV file'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFile}
          disabled={loading}
          className="sr-only"
        />
      </label>

      {result && (
        <p className={`text-sm ${result.startsWith('Imported') ? 'text-green-600' : 'text-red-500'}`}>
          {result}
        </p>
      )}

      <button
        type="button"
        onClick={() => { setOpen(false); setResult(''); }}
        className="self-start px-3 py-1 text-sm text-gray-400 hover:text-[#2B2B2B] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
