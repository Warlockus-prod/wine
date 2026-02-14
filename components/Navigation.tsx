import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-nav border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
              <span className="material-icons text-sm">wine_bar</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Sommelier<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              className="text-sm font-medium text-white hover:text-primary transition-colors"
              href="/"
            >
              Discover
            </Link>
            <Link
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              href="/pairing"
            >
              Wine Pairing
            </Link>
            <Link
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              href="/immersive"
            >
              Reservations
            </Link>
            <Link
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              href="/editorial"
            >
              Events
            </Link>
          </div>

          {/* User & CTA */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="material-icons">search</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <span className="material-icons text-base">person</span>
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
