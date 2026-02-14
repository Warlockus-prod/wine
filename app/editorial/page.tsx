"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditorialPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-gray-100 font-display min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-light tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              <span className="font-bold">LUX</span>DINING
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm tracking-wide font-medium text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">DISCOVER</a>
              <Link href="/pairing" className="hover:text-primary transition-colors flex items-center gap-1">
                AI PAIRING
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1">BETA</span>
              </Link>
              <a href="#" className="hover:text-primary transition-colors">MAGAZINE</a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-primary transition-colors">
              <span className="material-icons">search</span>
            </button>
            <button className="hidden md:block text-sm font-medium border border-gray-300 dark:border-white/20 px-5 py-2 rounded-full hover:bg-primary hover:border-primary hover:text-white transition-all duration-300">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Editorial Layout */}
      <header className="relative pt-20 min-h-[90vh] flex flex-col lg:flex-row overflow-hidden">
        {/* Text Content Area (Left/Top) */}
        <div className="lg:w-5/12 relative z-20 flex flex-col justify-center px-6 lg:pl-24 lg:pr-12 py-16 lg:py-0 bg-background-light dark:bg-background-dark">
          <div className="mb-6 flex items-center gap-3 animate-fade-in-up">
            <span className="px-3 py-1 text-xs font-bold tracking-widest text-white bg-primary rounded uppercase">Selection of October</span>
            <span className="w-12 h-[1px] bg-gray-300 dark:bg-gray-700"></span>
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400">New York City</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Le <span className="font-serif italic font-normal text-primary">Jardinier</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-10 max-w-md animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Modern French cuisine focused on vegetables, sustainability, and seasonality. An oasis of calm designed by architect Joseph Dirand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <button className="group bg-primary text-white px-8 py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-primary/20">
              <span className="tracking-wide font-medium">Book Experience</span>
              <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button className="group border border-gray-300 dark:border-white/10 px-8 py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-white/5 transition-all duration-300">
              <span className="tracking-wide font-medium">View Menu</span>
              <span className="material-icons text-sm text-gray-400 group-hover:text-primary transition-colors">restaurant_menu</span>
            </button>
          </div>

          {/* Stats/Rating */}
          <div className="mt-12 flex gap-8 border-t border-gray-200 dark:border-white/5 pt-8 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div>
              <span className="block text-2xl font-light">1</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Michelin Star</span>
            </div>
            <div>
              <span className="block text-2xl font-light">4.8</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Rating</span>
            </div>
            <div>
              <span className="block text-2xl font-light">$$$$</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range</span>
            </div>
          </div>
        </div>

        {/* Image Area (Right/Bottom) */}
        <div className="lg:w-7/12 relative h-[50vh] lg:h-auto overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background-light via-transparent to-transparent dark:from-background-dark dark:via-transparent dark:to-transparent z-10 lg:w-32"></div>
          <div className="absolute inset-0 bg-black/20 z-0"></div>
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhZxDy6hqO7CNqk9-AF3FashU3VLamsUMLPv3l-xJtXmCugTxVZymPBgWqs4069aoXIDYuINpXEP4Gq7ybwc-aAmiW-AjW72Fo2TDbD1t0zfOj2tSOC4s8Z9qK_rY3zNilxIMQLKkRRJgPiCj45sZqhogNTAj5sjlu2gfWqKekffRSgf9gM2ijNH35JQ9Kh0hYxD84eKClvFnl8Q-IWMRChRx2vbGyy6cVXndYsvJaJ_nZRiKy7zSzJcdY3n_1PJBez2hWBm6d19s"
            alt="Interior of a luxury modern restaurant with green velvet seating and marble tables"
            fill
            className="object-cover object-center transform hover:scale-105 transition-transform duration-[2s]"
          />

          {/* AI Pairing Floating Teaser */}
          <div className="absolute bottom-8 right-8 z-20">
            <Link href="/pairing">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl max-w-xs shadow-2xl transform hover:-translate-y-1 transition-transform cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/20 p-1.5 rounded-full">
                    <span className="material-icons text-primary text-sm">auto_awesome</span>
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase text-white/90">AI Sommelier</span>
                </div>
                <p className="text-sm text-white font-light">
                  &quot;The 2018 Sancerre pairs perfectly with the Vegetable Tart.&quot;
                </p>
                <div className="mt-3 h-0.5 w-full bg-white/10 overflow-hidden rounded-full">
                  <div className="h-full w-2/3 bg-primary"></div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Horizontal Scroll Section */}
      <section className="py-20 overflow-hidden bg-background-light dark:bg-background-dark relative">
        <div className="max-w-7xl mx-auto px-6 mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-light mb-2">Curated Selections</h2>
            <p className="text-gray-500 dark:text-gray-400 font-light">Explore other top-rated experiences near you.</p>
          </div>
          <div className="hidden md:flex gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-300 dark:border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-colors">
              <span className="material-icons text-sm">arrow_back</span>
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-300 dark:border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-colors">
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="pl-6 md:pl-[calc((100vw-80rem)/2+1.5rem)] overflow-x-auto hide-scrollbar pb-10 flex gap-6 pr-6 carousel-mask">
          {/* Card 1 */}
          <div className="group relative flex-none w-72 md:w-80 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:shadow-primary/10 transition-shadow">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDseDTAZcitZRHkzXsKsHhp-jOt9umhbNRxomno_meIxgsK1NefFRJX1EovVzhLSFGiUrMwPGfuRjJJMD664_Pn7xTB6-mc_4TDo0sAm3B8wTgL2EffvAxJaBhSMCGYlsPY2hR_eK-WnWrxqxfSlXSb3VzUmFZpCYb0TB7Z9AHDHFOtEskRkzyDk-KP7c7vHCqMoDXoqeVRqDSmiA7EHIMXl0q3uVRe5T9t3PAauWASjlZoqP86m1lHKw8gx0ewFXvGvylT0omjxqg"
              alt="Dark moody restaurant interior with warm lighting"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
              4.9 ★
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Japanese Fusion</p>
              <h3 className="text-2xl text-white font-serif italic mb-1">Nobu Downtown</h3>
              <p className="text-gray-300 text-sm font-light mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Classic dishes with new creations in a stunning subterranean space.
              </p>
              <div className="flex items-center text-xs text-gray-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                <span>New York, NY</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span>$$$$</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative flex-none w-72 md:w-80 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:shadow-primary/10 transition-shadow">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh-Q33JDSzjDej1aHTNkn6WuaK8D55gOp3VJVwtgvgxKnnrc2OFJBmjfTcvnnJVcAn06crQBEWAkB9h1tvhbD6R0UfBiUEYCL8WoKI2LPSX6h0VC2CIAXH8cKgucw6lVTFoQaKsTLqEM1gVambebuGXZOkKQVv6inq0HIYd3fr_IAaT6Td-RCauhgjgBO7lL6_bHjITyS0NLn2JFWE_G9Ro0DCLiCeY4tPm47BaPpuTK9N15SedfEbsuM0HI22Phn-YafKmsrPfuw"
              alt="Plated fine dining dish on a dark table"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
              4.7 ★
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Italian American</p>
              <h3 className="text-2xl text-white font-serif italic mb-1">Carbone</h3>
              <p className="text-gray-300 text-sm font-light mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Retro-glam destination serving elevated red-sauce classics.
              </p>
              <div className="flex items-center text-xs text-gray-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                <span>New York, NY</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span>$$$$</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative flex-none w-72 md:w-80 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:shadow-primary/10 transition-shadow">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3vWWUS7s37idv9aV05WDijj4idyrlnRltWIZTPSwEhnnA7Nl69uHINwbZYBa350SxBOpITRAThQjnFaH9HWTRnbe5WLIzSTEIXjI_Zd_iE3YXnOLPgE4pfkJcFWgS9ohV2PmoXtUEcFlujdnNXFQwqK7VKLBuhQildUHXsDIxZlGw-66DkL6P6GzbR-Fv3nUrT_LLveey90SqZJ8tomXM3JOX5Ouix9gTZC65dRV4VCmshhWQ57reIHp8dmvTQoocX5xItUFcSK8"
              alt="Bright elegant restaurant interior with high ceilings"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-white/10 flex items-center">
              3 <span className="material-icons text-[10px] ml-0.5 align-middle">star</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Plant-Based Fine Dining</p>
              <h3 className="text-2xl text-white font-serif italic mb-1">Eleven Madison Park</h3>
              <p className="text-gray-300 text-sm font-light mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                An iconic art deco restaurant overlooking Madison Square Park.
              </p>
              <div className="flex items-center text-xs text-gray-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                <span>New York, NY</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span>$$$$$</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative flex-none w-72 md:w-80 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:shadow-primary/10 transition-shadow">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqiNEgI7Y5H6BjO3BuAwsEoHw-2Ms_ezTXGdYHoJ1MtQ2P7KPMjMq2HNKBZ7zyjINCvjKo7TiXfLXGKpyciChF_FCj5l6pu4EDmU_8LTMCsv3R90Z8YEq4j8h2JgvC9lGBMpEdBSIQvAX8A0pcVQhZ1xUItwWdWTGub_pVRlTMm8fY6KMQZ-H6etwGmRgH1eIci-h3gL7NU6vAO8m2EWsfRXK-LwQ7nepx_hTykZHRVDKN2rc63wksmD0xXfPEWOJyYyo4gqpeEDY"
              alt="Abstract minimalist food plating"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-white/10 flex items-center">
              2 <span className="material-icons text-[10px] ml-0.5 align-middle">star</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Korean Tasting Menu</p>
              <h3 className="text-2xl text-white font-serif italic mb-1">Atomix</h3>
              <p className="text-gray-300 text-sm font-light mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Innovative Korean cuisine served in a sleek, minimalist counter setting.
              </p>
              <div className="flex items-center text-xs text-gray-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                <span>New York, NY</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span>$$$$</span>
              </div>
            </div>
          </div>

          {/* More Card */}
          <div className="group relative flex-none w-72 md:w-80 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-dashed border-gray-700 bg-surface-dark/50 flex flex-col items-center justify-center hover:bg-surface-dark transition-colors">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-icons">arrow_forward</span>
            </div>
            <span className="text-gray-400 font-medium">View All Restaurants</span>
          </div>
        </div>
      </section>

      {/* Short Editorial / Feature Highlight */}
      <section className="py-20 bg-surface-dark/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
            <div className="relative rounded-lg shadow-2xl z-10 overflow-hidden w-full h-96">
                <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmpH6-75RexPqpKKjxHMxJh-C_N-GYkOY65SPH_tcZe8xLu8TOIhML-Qy8s5N82av9ZQpzC0olkTHbe0NL368mStH8TSYn1IzQUaNXPxWRWMee2A9M6k0VJGu2l-fDHlK5wd92ab38lcvKWKQMf-e295VKJX-f7D8eEZ5M_gVLrfC6gXFONgu4gSy_G5KDKIDqErlQN5n-EoAorNmZqFVJITIXVxB934QzeY3n3Hhm28Fu7AM76QWPnQvyHZo2nkvO1nqzJt9qiCo"
                    alt="Sommelier pouring red wine into a glass"
                    fill
                    className="object-cover"
                />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-icons text-primary">auto_awesome</span>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light mb-6 leading-tight">
              The Perfect Pairing,<br/>
              <span className="font-serif italic text-primary">Every Single Time.</span>
            </h2>
            <p className="text-gray-400 font-light mb-8 leading-relaxed">
              Our proprietary AI analyzes thousands of flavor profiles to suggest the ideal wine pairing for any dish on our curated menus. Elevate your dining experience with sommelier-level precision.
            </p>
            <Link href="/pairing" className="inline-flex items-center gap-2 text-white border-b border-primary pb-1 hover:text-primary transition-colors">
              Try the Wine Pairing AI
              <span className="material-icons text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="bg-background-dark pt-20 pb-10 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-10">
            <div className="max-w-sm">
              <Link href="/" className="text-2xl font-light tracking-tight flex items-center gap-2 mb-6">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                <span className="font-bold text-white">LUX</span><span className="text-white">DINING</span>
              </Link>
              <p className="text-gray-500 font-light text-sm leading-relaxed">
                Curating the world&apos;s finest culinary experiences for the discerning palate. Discover, book, and experience excellence.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-primary transition-colors">Discover</a></li>
                  <li><Link href="/pairing" className="hover:text-primary transition-colors">AI Pairing</Link></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Reservations</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Magazine</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Stay Updated</h4>
              <form className="flex gap-2">
                <input
                  type="email"
                  className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-primary w-64 placeholder-gray-600"
                  placeholder="Email address"
                />
                <button className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <p>© 2023 LuxDining Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-400">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
