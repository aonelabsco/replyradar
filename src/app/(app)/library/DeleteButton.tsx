'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    setLoading(true);
    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      {loading ? '...' : 'delete'}
    </button>
  );
}
