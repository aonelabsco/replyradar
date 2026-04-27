import { getDb } from '@/lib/firebase';
import AddContentForm from './AddContentForm';
import ImportCsvButton from './ImportCsvButton';
import DeleteButton from './DeleteButton';

export const dynamic = 'force-dynamic';

interface ContentItem {
  id: string;
  type: 'tweet' | 'article';
  content: string;
  url: string | null;
  createdAt: string;
}

async function getContent(): Promise<ContentItem[]> {
  const db = getDb();
  const snap = await db.collection('myContent').orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      type: d.type as 'tweet' | 'article',
      content: d.content as string,
      url: (d.url as string | null) ?? null,
      createdAt: d.createdAt?.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }) ?? '—',
    };
  });
}

const TYPE_STYLE = {
  tweet: 'bg-sky-50 text-sky-600',
  article: 'bg-amber-50 text-amber-600',
};

export default async function LibraryPage() {
  const items = await getContent();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#2B2B2B]">Content library</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your tweets and articles used as context for reply generation.
        </p>
      </div>

      <div className="flex flex-wrap gap-0">
        <AddContentForm />
        <ImportCsvButton />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-300">No content yet — add your first item above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <span
                className={`mt-0.5 shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${TYPE_STYLE[item.type]}`}
              >
                {item.type}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2B2B2B] line-clamp-2">{item.content}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-amber-500 transition-colors truncate block mt-1"
                  >
                    {item.url}
                  </a>
                )}
                <p className="text-xs text-gray-300 mt-1">{item.createdAt}</p>
              </div>

              <DeleteButton id={item.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
