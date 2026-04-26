export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">{children}</main>
  );
}
