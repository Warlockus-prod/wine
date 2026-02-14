import Link from "next/link";

export default function HeroSection() {
  return (
    <header className="relative mb-12">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/16 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
          <span className="material-icons text-sm">auto_awesome</span>
          AI-Powered Curation
        </div>
        <h1 className="mb-4 text-5xl leading-tight font-extrabold tracking-tight text-white md:text-6xl">
          Curated Tastes.
          <br />
          <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Perfected by AI.
          </span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-gray-300">
          Premium dining discovery experience with intelligent wine pairing and backup
          catalog mode for full menu + admin testing.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/pairing"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-background-dark shadow-lg transition hover:bg-gray-200"
          >
            Open Pairing Demo
          </Link>
          <Link
            href="/v1"
            className="rounded-lg border border-white/10 bg-surface-dark px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"
          >
            Open Backup V1
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-primary/40 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/25"
          >
            V2 Admin Studio
          </Link>
        </div>
      </div>
    </header>
  );
}
