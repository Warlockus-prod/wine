"use client";

import React from 'react';
import Image from 'next/image';

const RESTAURANTS = [
  {
    id: 1,
    name: "Lumière & Oak",
    tags: ["Candlelit", "French Bistro"],
    description: "\"Where rustic Bordeaux blends meet slow-cooked heritage meats. An intimate dialogue between shadow, flame, and the vine.\"",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIs3dBxKqNFYzHgHJ4Woa2Ob894HXAX4FSp1papoimNogfQYdiAx--LBBW5xN-psAZ5xqioTsD6QwQ7bgMmzX7wFxMJBRA9XNqeqM_PcWY8DCaTuXL7oI7KrN3sFvOBfAyXRHpVqsCpa9L5tUOk9OsJ0Gmt3aRe1nJfDP10Glxar3ug5atqjQwW48KJE-CFXKOWaSPT11Ucyf2TJhlilvkDecD_c-Bpm5gcqWmztaAGgB3sBRVIIKcXVFnaSiRerr0JJWXwRecWVY"
  },
  {
    id: 2,
    name: "The Azure Drop",
    tags: ["Coastal", "Seafood"],
    description: "\"A symphony of salt and citrus. Crisp Albariño pairs effortlessly with our daily sustainable catch, harvested at dawn.\"",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuNphkuQ-rwREFJUtXN8R4ILXAEL5Lrr2FfzCj2b3NyYKNWig2Tf5nTIgD7MveRfSfJ7CbxhVEzgQQrTnTRK6Y1tI2Nn8ED67tSjApZeKT2OUDGpeWwwpp4ZrR0I6CvRT34hpXvUx-AtkY4ESjEA02002t75CLasKxT5IqYx8BSfyCAdrQVgCC7cltsWD8d1G0o2YKakKndqxhx54I6QnRDVZSPDyFUnXHEwPY1oQrKIzhgHGxtRPDoztaUpCP7d5xqP-t9hqGdqk"
  },
  {
    id: 3,
    name: "Obsidian Hearth",
    tags: ["Steakhouse", "Open Fire"],
    description: "\"Primal technique meets modern luxury. Bold Cabernet flows alongside prime cuts kissed by open oak flames.\"",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKPQWCw_vJdjz_eZCZT0NgCvul3aK2cDqWWPdw0Sh1W0TFRs6hnFEVZuhj2LVpJ8MoDaw35yiOQiywhWfbehnAKDqoLlgTzCMbgy78una0BVOFtzVLLaqiNs-w1Q2HCRYN7CSqavFjanyg1Ni-pcxskbfYOC1h5J_5SKTLLzSiicwlXJKPJJxBFLvMUPnYL6u3-kkNGRh2YFZbHITKbkleF_dQGemy9OkfasqjKcR5ElGaG8Of_kyssuK2xBbr9JN33qQsDU14ih4"
  },
  {
    id: 4,
    name: "Velvet Room",
    tags: ["Speakeasy", "Small Plates"],
    description: "\"Hidden away from the city's pulse. A sanctuary for rare vintage ports and artisanal small plates crafted for sharing.\"",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn4CbYZFMGBANHjEcA7cTIUM73xQwZsfofq3Gp8xHAo4vW2y-QdZC8vORUbKxs85CxOEGThHyw70uzzg232yMAllD5n6nFa9ZWkKfEWqZuJNwp5Ns3yK5txhfjliMabpo4O80wkoWFGa9qPzie-F1FR69PyAkYOOoOmdk6HlJGfa2udfl7cDdPpBGW8IXZF-E0ljThpceqNC1qklWRx1S-Keew4XjKOQZc7LEddizDAz2-A8Zp1cp_RA3WOSedh3Cup62yzBKOa2o"
  }
];

export default function ImmersivePage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-white font-display overflow-hidden h-screen w-screen">
      {/* Navigation Header (Fixed) */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <span className="material-icons text-primary text-2xl">wine_bar</span>
          <span className="text-xl font-medium tracking-wide italic font-serif">Epicurean</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm tracking-widest uppercase opacity-80 pointer-events-auto">
          <a href="#" className="hover:text-primary transition-colors">Collections</a>
          <a href="#" className="hover:text-primary transition-colors">Sommelier AI</a>
          <a href="#" className="hover:text-primary transition-colors">Reservations</a>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors duration-300 pointer-events-auto">
          <span className="material-icons text-sm">person</span>
        </button>
      </nav>

      {/* Main Vertical Scroll Container */}
      <main className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth relative">
        {RESTAURANTS.map((restaurant, index) => (
          <section key={restaurant.id} className="relative h-screen w-full snap-start shrink-0 flex items-end justify-center group overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-[2000ms] ease-out brightness-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-black/40"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-4xl px-6 pb-20 md:pb-32 text-center flex flex-col items-center">
              {/* Vibe Tags */}
              <div className="flex space-x-3 mb-6 opacity-0 animate-[fadeInUp_1s_ease-out_0.2s_forwards]">
                {restaurant.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded border border-white/20 text-xs uppercase tracking-widest bg-black/20 backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-6xl md:text-8xl font-serif font-medium leading-none mb-6 text-white tracking-tight opacity-0 animate-[fadeInUp_1s_ease-out_0.4s_forwards]">
                {restaurant.name}
              </h1>

              {/* Description */}
              <div className="max-w-xl mx-auto mb-10 opacity-0 animate-[fadeInUp_1s_ease-out_0.6s_forwards]">
                <p className="text-xl md:text-2xl text-gray-200 italic font-light leading-relaxed font-serif">
                  {restaurant.description}
                </p>
              </div>

              {/* Action Button */}
              <button className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded text-sm uppercase tracking-widest font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 opacity-0 animate-[fadeInUp_1s_ease-out_0.8s_forwards]">
                <span>Explore Menu</span>
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>
          </section>
        ))}
      </main>

      {/* Side Navigation Indicators */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col space-y-4 pointer-events-none">
        {RESTAURANTS.map((_, i) => (
          <div key={i} className={`w-1 ${i === 0 ? 'h-8 bg-primary' : 'h-2 bg-white/20'} rounded-full transition-all duration-300`}></div>
        ))}
      </div>

      {/* AI Sommelier FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="group flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 hover:scale-110 transition-transform duration-300 relative">
          <span className="material-icons text-white">smart_toy</span>
          <span className="absolute right-full mr-4 bg-white text-background-dark text-xs font-bold py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask Sommelier AI
          </span>
        </button>
      </div>

      {/* Scroll Hint at Bottom of First Slide */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 text-white/50 animate-bounce pointer-events-none mix-blend-overlay">
        <span className="material-icons">keyboard_arrow_down</span>
      </div>
    </div>
  );
}
