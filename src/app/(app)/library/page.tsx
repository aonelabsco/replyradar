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
  likes: number;
  engagements: number;
  topExample: boolean;
}

async function getContent(): Promise<ContentItem[]> {
  const db = getDb();
  const snap = await db.collection('myContent').orderBy('createdAt', 'desc').limit(200).get();

  const items = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      type: d.type as 'tweet' | 'article',
      content: d.content as string,
      url: (d.url as string | null) ?? null,
      createdAt: d.createdAt?.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }) ?? '—',
      likes: (d.likes as number) ?? 0,
      engagements: (d.engagements as number) ?? 0,
      topExample: false,
    };
  });

  // Mark the top 30 by engagement score — these are what the AI actually sees
  const sorted = [...items].sort(
    (a, b) => (b.likes + b.engagements) - (a.likes + a.engagements)
  );
  const topIds = new Set(sorted.slice(0, 30).map((i) => i.id));
  items.forEach((item) => { item.topExample = topIds.has(item.id); });

  return items;
}

const TYPE_STYLE = {
  tweet: 'bg-sky-50 text-sky-600',
  article: 'bg-amber-50 text-amber-600',
};

export default async function LibraryPage() {
  const items = await getContent();
  const topCount = items.filter((i) => i.topExample).length;

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

      {items.length > 0 && topCount > 0 && (
        <p className="text-xs text-gray-400 mb-4">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 mb-0.5" />
          {topCount} items are in the top 30 sent to the AI — sorted by engagement score.
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-300">No content yet — add your first item above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const score = item.likes + item.engagements;
            return (
              <li
                key={item.id}
                className={`flex items-start gap-3 p-4 border rounded-xl transition-colors ${
                  item.topExample
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
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
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-300">{item.createdAt}</p>
                    {score > 0 && (
                      <p className="text-xs text-gray-400">
                        {item.likes > 0 && `${item.likes} likes`}
                        {item.likes > 0 && item.engagements > 0 && ' · '}
                        {item.engagements > 0 && `${item.engagements} eng`}
                      </p>
                    )}
                    {item.topExample && (
                      <span className="text-xs text-amber-500 font-medium">top example</span>
                    )}
                  </div>
                </div>

                <DeleteButton id={item.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
