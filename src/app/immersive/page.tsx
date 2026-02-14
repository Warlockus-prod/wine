import Image from "next/image";
import Link from "next/link";
import MobileTabBar from "@/components/v2/MobileTabBar";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";

const RESTAURANTS = [
  {
    id: 1,
    name: "Lumiere & Oak",
    tags: ["Candlelit", "French Bistro"],
    description:
      "Where rustic Bordeaux blends meet slow-cooked heritage meats in an intimate evening setting.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCIs3dBxKqNFYzHgHJ4Woa2Ob894HXAX4FSp1papoimNogfQYdiAx--LBBW5xN-psAZ5xqioTsD6QwQ7bgMmzX7wFxMJBRA9XNqeqM_PcWY8DCaTuXL7oI7KrN3sFvOBfAyXRHpVqsCpa9L5tUOk9OsJ0Gmt3aRe1nJfDP10Glxar3ug5atqjQwW48KJE-CFXKOWaSPT11Ucyf2TJhlilvkDecD_c-Bpm5gcqWmztaAGgB3sBRVIIKcXVFnaSiRerr0JJWXwRecWVY",
  },
  {
    id: 2,
    name: "The Azure Drop",
    tags: ["Coastal", "Seafood"],
    description:
      "A symphony of salt and citrus with crisp white wines and sustainably sourced catch.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuNphkuQ-rwREFJUtXN8R4ILXAEL5Lrr2FfzCj2b3NyYKNWig2Tf5nTIgD7MveRfSfJ7CbxhVEzgQQrTnTRK6Y1tI2Nn8ED67tSjApZeKT2OUDGpeWwwpp4ZrR0I6CvRT34hpXvUx-AtkY4ESjEA02002t75CLasKxT5IqYx8BSfyCAdrQVgCC7cltsWD8d1G0o2YKakKndqxhx54I6QnRDVZSPDyFUnXHEwPY1oQrKIzhgHGxtRPDoztaUpCP7d5xqP-t9hqGdqk",
  },
  {
    id: 3,
    name: "Obsidian Hearth",
    tags: ["Steakhouse", "Open Fire"],
    description:
      "Primal technique meets modern luxury with bold reds and charred prime cuts.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKPQWCw_vJdjz_eZCZT0NgCvul3aK2cDqWWPdw0Sh1W0TFRs6hnFEVZuhj2LVpJ8MoDaw35yiOQiywhWfbehnAKDqoLlgTzCMbgy78una0BVOFtzVLLaqiNs-w1Q2HCRYN7CSqavFjanyg1Ni-pcxskbfYOC1h5J_5SKTLLzSiicwlXJKPJJxBFLvMUPnYL6u3-kkNGRh2YFZbHITKbkleF_dQGemy9OkfasqjKcR5ElGaG8Of_kyssuK2xBbr9JN33qQsDU14ih4",
  },
  {
    id: 4,
    name: "Velvet Room",
    tags: ["Speakeasy", "Small Plates"],
    description:
      "A hidden lounge where rare vintage ports meet shareable culinary craft.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAn4CbYZFMGBANHjEcA7cTIUM73xQwZsfofq3Gp8xHAo4vW2y-QdZC8vORUbKxs85CxOEGThHyw70uzzg232yMAllD5n6nFa9ZWkKfEWqZuJNwp5Ns3yK5txhfjliMabpo4O80wkoWFGa9qPzie-F1FR69PyAkYOOoOmdk6HlJGfa2udfl7cDdPpBGW8IXZF-E0ljThpceqNC1qklWRx1S-Keew4XjKOQZc7LEddizDAz2-A8Zp1cp_RA3WOSedh3Cup62yzBKOa2o",
  },
];

export default function ImmersivePage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background-dark text-white">
      <nav className="pointer-events-none fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-6 py-6">
        <Link href="/" className="pointer-events-auto flex items-center space-x-2">
          <span className="material-icons text-2xl text-primary">wine_bar</span>
          <span className="font-serif text-xl tracking-wide italic">Epicurean</span>
        </Link>
        <div className="pointer-events-auto hidden items-center gap-7 text-sm tracking-widest text-gray-200 uppercase md:flex">
          <Link href="/" className="hover:text-primary">
            Collections
          </Link>
          <Link href="/pairing" className="hover:text-primary">
            Sommelier AI
          </Link>
          <Link href="/v1" className="hover:text-primary">
            Backup V1
          </Link>
        </div>
        <Link
          href="/admin"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-primary"
          aria-label="Open admin"
        >
          <span className="material-icons text-sm">person</span>
        </Link>
      </nav>

      <main className="hide-scrollbar relative h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        {RESTAURANTS.map((restaurant) => (
          <section
            key={restaurant.id}
            className="group relative flex h-screen w-full shrink-0 snap-start items-end justify-center overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                quality={68}
                placeholder="blur"
                blurDataURL={GENERIC_BLUR_DATA_URL}
                priority={restaurant.id === 1}
                sizes="100vw"
                className="object-cover brightness-50 transition-transform duration-[2000ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-black/40" />
            </div>

            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pb-28 text-center md:pb-28">
              <div className="mb-6 flex gap-3 opacity-0 animate-[fade-in-up_1s_ease-out_0.2s_forwards]">
                {restaurant.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-white/20 bg-black/20 px-3 py-1 text-xs tracking-widest uppercase backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mb-6 font-serif text-6xl leading-none tracking-tight text-white opacity-0 animate-[fade-in-up_1s_ease-out_0.4s_forwards] md:text-8xl">
                {restaurant.name}
              </h1>

              <p className="mb-10 max-w-2xl font-serif text-xl leading-relaxed text-gray-200 italic opacity-0 animate-[fade-in-up_1s_ease-out_0.6s_forwards] md:text-2xl">
                {restaurant.description}
              </p>

              <Link
                href="/pairing"
                className="flex items-center gap-2 rounded bg-primary px-8 py-4 text-sm font-bold tracking-widest uppercase opacity-0 transition-all duration-300 hover:scale-105 hover:bg-red-700 animate-[fade-in-up_1s_ease-out_0.8s_forwards]"
              >
                <span>Explore Pairings</span>
                <span className="material-icons text-sm">arrow_forward</span>
              </Link>
            </div>
          </section>
        ))}
      </main>

      <div className="pointer-events-none fixed right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col space-y-3">
        {RESTAURANTS.map((restaurant, index) => (
          <div
            key={restaurant.id}
            className={`rounded-full transition-all duration-300 ${
              index === 0 ? "h-8 w-1 bg-primary" : "h-2 w-1 bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="fixed right-8 bottom-8 z-50">
        <Link
          href="/pairing"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform duration-300 hover:scale-110"
        >
          <span className="material-icons text-white">smart_toy</span>
          <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded bg-white px-3 py-1 text-xs font-bold text-background-dark opacity-0 transition-opacity group-hover:opacity-100">
            Ask Sommelier AI
          </span>
        </Link>
      </div>
      <MobileTabBar />
    </div>
  );
}
