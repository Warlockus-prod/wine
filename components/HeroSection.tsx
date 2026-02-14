import React from 'react';

export default function HeroSection() {
  return (
    <header className="mb-12 relative">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="material-icons text-sm">auto_awesome</span>
          AI-Powered Curation
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Curated Tastes.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">Perfected by AI.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
          Explore our selection of premium dining experiences. Our AI Sommelier analyzes every menu to suggest the perfect wine pairing before you even book.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mt-8">
        <button className="px-5 py-2.5 rounded-lg bg-white text-background-dark font-medium text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-primary/5">All</button>
        <button className="px-5 py-2.5 rounded-lg bg-surface-dark border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 hover:text-white transition-colors">Michelin Starred</button>
        <button className="px-5 py-2.5 rounded-lg bg-surface-dark border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 hover:text-white transition-colors">Casual Fine Dining</button>
        <button className="px-5 py-2.5 rounded-lg bg-surface-dark border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 hover:text-white transition-colors">Tasting Menu</button>
      </div>
    </header>
  );
}
