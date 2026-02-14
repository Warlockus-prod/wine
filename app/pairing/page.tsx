"use client";

import React, { useState } from 'react';
import Image from 'next/image';

// Type definitions
interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
  category: 'Starter' | 'Main' | 'Dessert';
}

interface Wine {
  id: string;
  name: string;
  region: string;
  year: number;
  price: number;
  rating: number;
  description: string;
  image: string;
  tags: string[];
  matchScore?: number;
  matchReason?: string;
  isMatch: boolean;
}

// Mock Data
const DISHES: Dish[] = [
  {
    id: 'escargots',
    name: 'Escargots de Bourgogne',
    price: 18,
    description: 'Burgundy snails, garlic herb butter, parsley, toasted baguette points.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0',
    tags: ['Appetizer', 'Classic'],
    category: 'Starter'
  },
  {
    id: 'duck-confit',
    name: 'Duck Confit',
    price: 34,
    description: 'Slow-cooked duck leg, crispy skin, sarladaise potatoes, garlic, duck fat, thyme jus.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ',
    tags: ['Rich', 'Savory', 'Fatty'],
    category: 'Main'
  },
  {
    id: 'beef-tartare',
    name: 'Beef Tartare',
    price: 22,
    description: 'Hand-cut beef fillet, capers, shallots, egg yolk, tabasco, worcestershire.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c',
    tags: ['Raw', 'Spicy'],
    category: 'Starter'
  },
  {
    id: 'scallops',
    name: 'Seared Scallops',
    price: 28,
    description: 'Jumbo scallops, cauliflower purée, truffle oil, micro greens.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A',
    tags: ['Seafood', 'Delicate'],
    category: 'Main'
  }
];

const WINES: Wine[] = [
  {
    id: 'riesling',
    name: 'Trimbach Riesling',
    region: 'Alsace, France',
    year: 2020,
    price: 52,
    rating: 4.8,
    description: 'Bone-dry with a lemon-lime backbone. Mineral notes of petrol and slate complement the savory herbs of the confit.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABMH3ZAPvQDWYLpx-j0KtibgdkAUtyn9irKC3oXRspQSs0L9BsBfegaa05g4i_0tSTAW2oZUOVeLU0TtyFc1K6gp9TfjjgZ7Lh0uRB-UYI67OyHB5bXgnk2CgEXCNZJm2Su_74shDXO5hQdBWcAooOCdq4ysIJzg54UF46RvRo01GL2ZqihghrKbGQqaoITAMvMzcLiiJaVn6TBq2OkAquPEoUQVI81Wgbb-9V35UAkU0E365Iug6VT10azf1carabk54uYi1aZ9Q',
    tags: ['Dry', 'High Acid'],
    matchScore: 98,
    matchReason: 'The high acidity of this dry Riesling cuts through the richness of the duck fat perfectly.',
    isMatch: true
  },
  {
    id: 'pinot',
    name: 'Cristom Pinot Noir',
    region: 'Willamette Valley, USA',
    year: 2018,
    price: 68,
    rating: 4.2,
    description: 'Bright red cherry and raspberry notes with earthy undertones. A classic pairing for duck.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE5USocOgYDhITeOQgMjG7LsiFuP3dqCZ6ueQfcYZ8fhmANSDP1Ms-UZ9B9oJVJPYSOaZ3VpdtN3zyNF8TlHglSTJVg9gHSm_0tFfHPX5s97iOrE5dkxl8WQVXA0nFYyNZWuN2uKMWMhyYj5Bo2XsLZP1kAg3uWQqsMZZWtxGUHxxvebDE7WZyPDwuWr3r-VBADpbh-N9Sqxz6jI6vK_L0e7aPNXfeLMb5unfSqT2DCc9df0kvGi7FH92cvQDILKSbktOz8E-Xxjk',
    tags: ['Light Body', 'Earthy'],
    matchScore: 95,
    matchReason: 'Fruity Pinot contrasts the salty cure.',
    isMatch: true
  },
  {
    id: 'cabernet',
    name: "Stag's Leap Cabernet",
    region: 'Napa Valley, USA',
    year: 2019,
    price: 85,
    rating: 4.5,
    description: 'Full-bodied, tannins are too strong for the delicate duck meat. Better suited for steak.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0K331aFTTh8xf47OiTmQkjzYyZgsVD8dtLxHbYmrVTeRYnzM9_sxSUJNLifZ7_opq23tVHQwU759mDWEjQC09iYiQIw7WnQmDCo82059t1Elow-QvBZreisUpw7R37nPZGSPem6SAgjbQsp7J8EKLHZVJyIOg2Fa2GO67LBWEF1MdpmF3llAdkLBrQy2Wz24RK7T5Z7Jo7BthcvqGi_Gzm_KZROTfmpEl17VY34aF6paOjoGOelftLHRxt0AGBc4zkKmYCt2tB7Y',
    tags: ['Bold', 'Tannic'],
    matchScore: 34,
    matchReason: 'Low Match Score (34%)',
    isMatch: false
  },
  {
    id: 'rose',
    name: "Château d'Esclans Rosé",
    region: 'Provence, France',
    year: 2021,
    price: 45,
    rating: 4.0,
    description: 'Refreshing and light, but lacks the structural acidity needed here.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTbxB_RLGGuNNlEY6_aWuM1r77Q-7NQwx10_8Y_xN-XYN6hS0sMOpNmzpTvTNYMpWx4NIGkf-fEv4DIhN8O8y5hsTrWAplmhMkwsEOFhpMyfLP5c5w5pID7cRlk8quUWEF70XRhU38CCLnXTghZt1pykh4bkZK0OKa3EG56NHBS3LDlOy0CXoZCORtSZZe2mSMjK7GvAntDHQWy8RVWuqVtaSUUsluhysKaKk7N_OPwl-iURyfGpR3lun0WfF_nkagtyvx7PU2kQs',
    tags: ['Crisp', 'Fruity'],
    matchScore: 40,
    matchReason: 'Too light.',
    isMatch: false
  }
];

export default function PairingPage() {
  const [activeDishId, setActiveDishId] = useState<string>('duck-confit');

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 font-display h-screen flex flex-col overflow-hidden selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="h-16 border-b border-primary/20 bg-background-light dark:bg-surface-dark flex items-center justify-between px-6 z-20 shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">L'</div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">L'ATELIER</h1>
        </div>

        <div className="hidden md:flex items-center bg-white dark:bg-surface-darker px-4 py-2 rounded-full border border-gray-200 dark:border-primary/20 w-96">
          <span className="material-icons text-gray-400 dark:text-primary/60 text-sm mr-2">wine_bar</span>
          <input
            className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0"
            placeholder="Ask the AI Sommelier..."
            type="text"
          />
        </div>

        <nav className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Menu</button>
          <button className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Reservations</button>
          <button className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-icons text-sm">person</span>
          </button>
        </nav>
      </header>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Background Element for ambiance */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
        </div>

        {/* Left Column: The Kitchen (Menu) */}
        <section className="w-1/2 h-full overflow-y-auto border-r border-primary/10 relative z-10 bg-background-light dark:bg-background-dark p-6 lg:p-10">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">The Kitchen</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Select a dish to discover its perfect wine pairing.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">Mains</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-surface-dark text-gray-600 dark:text-gray-400">Starters</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-surface-dark text-gray-600 dark:text-gray-400">Desserts</span>
            </div>
          </div>

          <div className="space-y-6">
            {DISHES.map((dish) => {
              const isActive = activeDishId === dish.id;

              return (
                <div
                  key={dish.id}
                  onClick={() => setActiveDishId(dish.id)}
                  className={`
                    relative flex gap-4 p-5 rounded-xl border transition-all duration-300 cursor-pointer shadow-sm
                    ${isActive
                      ? 'border-primary bg-white dark:bg-surface-dark active-dish-glow transform scale-[1.02] z-10'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-primary/20 opacity-40 hover:opacity-100 bg-white dark:bg-surface-dark'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <span className="material-icons text-[14px]">restaurant</span>
                      Selected
                    </div>
                  )}

                  <div className={`
                    flex-shrink-0 rounded-lg overflow-hidden relative
                    ${isActive ? 'w-40 h-40 shadow-md' : 'w-32 h-32'}
                  `}>
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className={`flex justify-between items-start ${isActive ? 'mb-2' : 'mb-1'}`}>
                        <h3 className={`${isActive ? 'text-xl' : 'text-lg'} font-bold text-gray-900 dark:text-white`}>{dish.name}</h3>
                        <span className={`${isActive ? 'text-2xl' : 'text-base'} font-bold text-primary`}>${dish.price}</span>
                      </div>
                      <p className={`text-sm text-gray-500 dark:text-gray-400 ${!isActive && 'line-clamp-2'}`}>
                        {dish.description}
                      </p>
                    </div>

                    <div className={`flex flex-wrap gap-2 ${isActive ? 'mt-3' : 'mt-2'}`}>
                      {dish.tags.map(tag => (
                        <span
                          key={tag}
                          className={`
                            text-[10px] uppercase tracking-wider rounded px-2 py-0.5
                            ${isActive
                              ? 'text-primary border border-primary/30 bg-primary/5'
                              : 'text-gray-400 border border-gray-300 dark:border-gray-700'
                            }
                          `}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: The Cellar (Wines) */}
        <section className="w-1/2 h-full overflow-y-auto bg-gray-100 dark:bg-surface-darker p-6 lg:p-10 relative">
          <div className="sticky top-0 z-20 pb-6 bg-gray-100 dark:bg-surface-darker">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                The Cellar
                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">AI Pairing Mode Active</span>
              </h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <span className="material-icons">filter_list</span>
              </button>
            </div>
            <div className="h-1 w-full bg-gray-200 dark:bg-surface-dark rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3 animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-6">
            {WINES.map((wine, index) => {
              if (wine.isMatch) {
                // Determine if primary or secondary match based on score
                const isPrimary = wine.matchScore && wine.matchScore >= 98;

                return (
                  <div key={wine.id} className={`
                    relative rounded-xl bg-white dark:bg-surface-dark border p-5 transition-all duration-500
                    ${isPrimary
                      ? 'border-primary ai-match-glow'
                      : 'border-primary/50 shadow-[0_0_15px_rgba(209,21,52,0.15)]'
                    }
                  `}>
                    {/* AI Insight Bubble */}
                    {isPrimary ? (
                      <div className="absolute -top-4 left-6 bg-gradient-to-r from-primary to-rose-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-start gap-3 max-w-sm z-10 transform -rotate-1">
                        <span className="material-symbols-outlined text-lg mt-0.5 animate-pulse">auto_awesome</span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">AI Match • {wine.matchScore}% Compatibility</p>
                          <p className="text-sm font-medium leading-tight">{wine.matchReason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute -top-3 right-6 bg-surface-dark border border-primary/40 text-gray-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 max-w-xs z-10">
                        <span className="material-symbols-outlined text-sm text-primary">psychology</span>
                        <p className="text-xs font-medium">{wine.matchReason}</p>
                      </div>
                    )}

                    <div className={`flex gap-5 ${isPrimary ? 'mt-4' : ''}`}>
                      <div className="w-20 h-48 bg-gray-100 dark:bg-background-dark rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 border border-gray-200 dark:border-white/5">
                        <Image
                          src={wine.image}
                          alt={wine.name}
                          fill
                          className="object-cover mix-blend-overlay opacity-80"
                        />
                        {/* Bottle silhouette overlay for consistency */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-2 text-white text-[10px] font-bold text-center w-full px-1 uppercase">{wine.region.split(',')[0]}</div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{wine.name}</h3>
                              <p className="text-sm text-primary font-medium">{wine.region} • {wine.year}</p>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">${wine.price}</span>
                          </div>

                          <div className="flex items-center gap-1 mb-3">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className={`material-icons text-xs ${star <= Math.floor(wine.rating) ? 'text-yellow-500' : (star === Math.ceil(wine.rating) ? 'text-yellow-500' : 'text-gray-600')}`}>
                                {star <= Math.floor(wine.rating) ? 'star' : (star === Math.ceil(wine.rating) ? 'star_half' : 'star')}
                              </span>
                            ))}
                            <span className="text-xs text-gray-500 ml-1">({wine.rating})</span>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                            {wine.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-2">
                            {wine.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-background-light dark:bg-background-dark rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {isPrimary ? (
                            <button className="bg-white dark:bg-white text-primary dark:text-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                              Add to Order <span className="material-icons text-sm">add</span>
                            </button>
                          ) : (
                            <button className="text-primary hover:text-white hover:bg-primary border border-primary/20 hover:border-primary px-4 py-2 rounded-lg text-sm font-bold transition-all">
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Non-matching wines
                return (
                  <div key={wine.id} className="relative flex gap-5 p-5 rounded-xl border border-transparent bg-white dark:bg-surface-dark opacity-30 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-300">
                    <div className="w-20 h-48 bg-gray-100 dark:bg-background-dark rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
                      <Image
                        src={wine.image}
                        alt={wine.name}
                        fill
                        className="object-cover mix-blend-overlay"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{wine.name}</h3>
                            <p className="text-sm text-gray-500">{wine.region} • {wine.year}</p>
                          </div>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">${wine.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {wine.description}
                        </p>
                      </div>

                      {wine.matchScore && (
                        <div className="mt-2">
                          <span className="text-xs text-red-400 italic">{wine.matchReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Bottom Fade for scrolling hint */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-100 dark:from-surface-darker to-transparent pointer-events-none"></div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-white dark:bg-surface-darker border-t border-gray-200 dark:border-primary/10 py-3 px-6 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            AI Sommelier Online
          </span>
          <span>|</span>
          <span>Menu last updated: Today</span>
        </div>
        <div>
          L'Atelier © 2023 • Premium Dining Experience
        </div>
      </footer>
    </div>
  );
}
