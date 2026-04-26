import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <p className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
        Offline Mode
      </p>
      <h1 className="text-3xl font-bold">Connection is unavailable</h1>
      <p className="max-w-md text-sm text-gray-300">
        The app shell is still available. Reconnect to continue syncing menus and pairings.
      </p>
      <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
        Back to Home
      </Link>
    </main>
  );
}
