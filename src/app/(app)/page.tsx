import Link from 'next/link';

const ROUTES = [
  {
    href: '/feed',
    label: 'Feed',
    desc: 'Browse tweets from target accounts and generate reply suggestions.',
  },
  {
    href: '/quick',
    label: 'Quick reply',
    desc: 'Paste any tweet and get reply suggestions instantly.',
  },
  {
    href: '/library',
    label: 'Content library',
    desc: 'Manage your tweets and articles used as context for replies.',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#2B2B2B] mb-1">newb reply lab</h1>
      <p className="text-gray-500 text-sm mb-10">
        Find reply opportunities and generate on-brand replies.
      </p>

      <div className="flex flex-col gap-3">
        {ROUTES.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <div>
              <p className="text-sm font-medium text-[#2B2B2B] group-hover:text-amber-500 transition-colors">
                {label}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-amber-400 transition-colors mt-0.5 text-lg leading-none">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
