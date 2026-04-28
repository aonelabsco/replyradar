import Link from 'next/link';
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

interface Decision {
  id: string;
  originalTweet: string;
  reply: string;
  status: 'approved' | 'edited' | 'rejected';
  originalReply: string | null;
  createdAt: string;
}

async function getContentCount(): Promise<number> {
  const db = getDb();
  const snap = await db.collection('myContent').count().get();
  return snap.data().count;
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

  const sorted = [...items].sort(
    (a, b) => (b.likes + b.engagements) - (a.likes + a.engagements)
  );
  const topIds = new Set(sorted.slice(0, 30).map((i) => i.id));
  items.forEach((item) => { item.topExample = topIds.has(item.id); });

  return items;
}

async function getDecisions(): Promise<Decision[]> {
  const db = getDb();
  const snap = await db.collection('approvedReplies').orderBy('createdAt', 'desc').limit(200).get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    const status = (d.status as string) ?? (d.edited ? 'edited' : 'approved');
    return {
      id: doc.id,
      originalTweet: d.originalTweet as string,
      reply: d.reply as string,
      status: status as Decision['status'],
      originalReply: (d.originalReply as string | null) ?? null,
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

const STATUS_STYLE = {
  approved: { dot: 'bg-green-400', label: 'text-green-600', text: 'approved' },
  edited:   { dot: 'bg-amber-400', label: 'text-amber-600', text: 'edited' },
  rejected: { dot: 'bg-gray-300',  label: 'text-gray-400',  text: 'rejected' },
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === 'decisions' ? 'decisions' : 'library';

  const [items, decisions, totalCount] = await Promise.all([
    getContent(),
    getDecisions(),
    getContentCount(),
  ]);

  const topCount = items.filter((i) => i.topExample).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#2B2B2B]">Content library</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your tweets and articles used as context for reply generation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        <Link
          href="/library"
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'library'
              ? 'border-[#2B2B2B] text-[#2B2B2B]'
              : 'border-transparent text-gray-400 hover:text-[#2B2B2B]'
          }`}
        >
          Library
          <span className="ml-1.5 text-xs text-gray-300">{totalCount}</span>
        </Link>
        <Link
          href="/library?tab=decisions"
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'decisions'
              ? 'border-[#2B2B2B] text-[#2B2B2B]'
              : 'border-transparent text-gray-400 hover:text-[#2B2B2B]'
          }`}
        >
          Decisions
          <span className="ml-1.5 text-xs text-gray-300">{decisions.length}</span>
        </Link>
      </div>

      {activeTab === 'library' && (
        <>
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
                    <span className={`mt-0.5 shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${TYPE_STYLE[item.type]}`}>
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2B2B2B] line-clamp-2">{item.content}</p>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-amber-500 transition-colors truncate block mt-1">
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
        </>
      )}

      {activeTab === 'decisions' && (
        <>
          {decisions.length === 0 ? (
            <p className="text-sm text-gray-300">No decisions yet — generate and review replies on the Quick page.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {decisions.map((d) => {
                const s = STATUS_STYLE[d.status];
                return (
                  <div key={d.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    {/* Original tweet */}
                    {d.originalTweet && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        <span className="font-medium text-gray-300">Tweet: </span>
                        {d.originalTweet}
                      </p>
                    )}

                    {/* Generated / final reply */}
                    <p className={`text-sm mb-2 ${d.status === 'rejected' ? 'text-gray-400' : 'text-[#2B2B2B]'}`}>
                      {d.reply}
                    </p>

                    {/* If edited, show what was originally generated */}
                    {d.status === 'edited' && d.originalReply && (
                      <p className="text-xs text-gray-300 line-clamp-1 mb-2">
                        <span className="font-medium">was: </span>{d.originalReply}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.label}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.text}
                      </span>
                      <span className="text-xs text-gray-300">{d.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
