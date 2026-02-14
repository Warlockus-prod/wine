import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <span className="material-icons text-sm">wine_bar</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Sommelier<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link className="text-sm font-medium text-white hover:text-primary" href="/">
            Discover
          </Link>
          <Link
            className="text-sm font-medium text-gray-300 hover:text-white"
            href="/pairing"
          >
            Wine Pairing
          </Link>
          <Link
            className="text-sm font-medium text-gray-300 hover:text-white"
            href="/immersive"
          >
            Reservations
          </Link>
          <Link
            className="text-sm font-medium text-gray-300 hover:text-white"
            href="/editorial"
          >
            Events
          </Link>
          <Link
            className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/25"
            href="/v1"
          >
            Backup V1
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-lg border border-white/20 bg-white/8 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/16 md:inline-flex"
            href="/v1/admin"
          >
            Admin
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14"
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
