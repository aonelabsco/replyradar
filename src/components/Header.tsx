'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_LINKS = [
  { href: '/feed', label: 'feed' },
  { href: '/quick', label: 'quick' },
  { href: '/library', label: 'library' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  // Hide header on login page
  if (pathname === '/login') return null;

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-semibold text-[#2B2B2B] tracking-tight hover:text-amber-500 transition-colors text-sm whitespace-nowrap"
        >
          newb reply lab
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gray-100 text-[#2B2B2B]'
                    : 'text-gray-500 hover:text-[#2B2B2B] hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-[#2B2B2B] transition-colors whitespace-nowrap"
        >
          logout
        </button>
      </div>
    </header>
  );
}
