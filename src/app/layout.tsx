import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'newb reply lab',
  description: 'X reply opportunity finder and reply generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#2B2B2B]">
        <Header />
        {children}
      </body>
    </html>
  );
}
