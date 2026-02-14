import Link from "next/link";
import HeroSection from "@/components/v2/HeroSection";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import RestaurantCard from "@/components/v2/RestaurantCard";

const RESTAURANT_SHOWCASE = [
  {
    name: "Le Jardin Secret",
    category: "French Haute Cuisine",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA_WsNRlCkrY0Hi6HbdTxkCN-gPKhUELj6V4N13LtRzIIvJHXSD_GZCGnnB0r8sSluauD9WMmaTPMQg70BHyuYJOqN1Ry7ovxyQsIODPhGC5BgMeTV2JDv15Zpt2JDhdUaYOr2sMPSKPZtXTO9XrhnT6YvDPvoBD0WtPdfJb781RkBnZ98miqXw_R8fIaCQDjToQI8mto7dpu1IWl6860OvaifOhvgC6G0G3VUig5oVS4_4mc7VarC4wEN5AVakXwE0W-eBbfMX8SU",
    rating: 4.9,
    reviewCount: "1.2k",
    price: "$$$$",
    location: "Paris, 1st Arr.",
    matchScore: 98,
    variant: "large" as const,
    className: "h-full md:col-span-8",
    href: "/pairing",
    priority: true,
  },
  {
    name: "Prime Cut",
    category: "Premium Steakhouse",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDrLIJvR2jp46jBv7TXMChcLgX2UReFF1Fk7Rt7csGnNsIMWhuy4vCq-9yMJVtMuojNjuqIUPL70hzZ-2dzW3HlQWtECvzS87uhD5vxRk4ULntq8hm53Ck1GfUmgnAK5sVucLtoNmnf4nl6Rkv2Jil4R_JD0PSA2_3HwKccVONp7CVww-wJzgmclcraxkDZRA_0CxZPHEVMnnLltOiOY1FPfIaZ0bE-WgIaBTJ4RYxrEQ1Vurj3a3_7DlZ6ysgs-plY70KtSD_vueE",
    rating: 4.8,
    price: "$$$$",
    matchScore: 95,
    className: "h-full md:col-span-4",
    href: "/pairing",
    priority: false,
  },
  {
    name: "Ocean Blue",
    category: "Seafood & Raw Bar",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFIH_US2kPRd6ak8QMLVdxkuQeaTnAhmHBTdBEOmSDGpejB2oVXasKCWEQ7UcA6pUWxlBQLUIJVOV7sXP-3_RxpPoSzoIqpweJcqzdYH8Go8MHITphD1UVNOE0EMQdrEk5F3UNX4nGjKPQC3dwVXQFxHs97-CKs4cfzJ_rk1kCvL1GjfC4dBJmAUW_md9ZXH-0iZ5szzfCQkbAzOUFk2PGVTmqzVCgLGp-95Z70vR-MPi4iWHqzS4gGlcNDcF8rKYeS7oqfl6-9Oo",
    rating: 4.7,
    price: "$$$",
    pairingAvailable: true,
    description: "Fresh catch daily, flown in from Tsukiji Market.",
    className: "h-full md:col-span-5",
    href: "/immersive",
    priority: false,
  },
  {
    name: "Trattoria Roma",
    category: "Authentic Italian",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDL71yH65d9VuJsLEPyWfhQUss_EpKDl1aAl8r-1AM21GCm0EFY8rjoFOhtpwXA07Ylg3NB0UeLtnjb-l6BaothY4Zd5S2QdXMXsHkK9DUOSgKFg0ILWhPTwpgXJcrjEPiuVSLb52QixBkaW2g2rUanRW0Zdvkze5q7itU1y4i1DIE0IaXkCciSa-giGNqSArQPS2dH-ojEDR6R3ejMm38UcaOw5YBEc1VX_hpmUWr3Cv1Ue9oKALDpVR9S_jBUVbwemmkrgG95Zvw",
    rating: 4.6,
    price: "$$",
    matchScore: 92,
    className: "h-full md:col-span-4",
    href: "/editorial",
    priority: false,
  },
  {
    name: "Zen",
    category: "Modern Asian Fusion",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDv_XOZnfkhjFYA1vWahUlwvnT5k0vlcZaO-sS9uTfmQtJyElk_a-HyOxsrnqytDKmd2RK7e_W2gmvtGjAgYsWqvx6LvJFfQdELfEc8GytEMWKmsyndrgcuEn8D8h3NkhZPxNF6vQNgwQR-YMov39sPrdHY1yZ9AhFFi2Y0qO9RwnBm0na_kpTXgsedfBBdf6m9_snQdq9h9iB3Iqy6Y0cQeL4H30cq2pzgD6wTjQllsZwwDR4an1YND2N44lLHnQKjA6454ae0HlE",
    rating: 4.8,
    price: "$$$",
    pairingAvailable: true,
    className: "h-full md:col-span-3",
    href: "/pairing",
    priority: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl flex-1 px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <HeroSection />

        <div className="grid auto-rows-[300px] grid-cols-1 gap-6 md:auto-rows-[380px] md:grid-cols-12">
          {RESTAURANT_SHOWCASE.map((restaurant) => (
            <Link key={restaurant.name} href={restaurant.href} className={restaurant.className}>
              <RestaurantCard
                category={restaurant.category}
                className="h-full"
                description={restaurant.description}
                image={restaurant.image}
                location={restaurant.location}
                matchScore={restaurant.matchScore}
                name={restaurant.name}
                pairingAvailable={restaurant.pairingAvailable}
                price={restaurant.price}
                priority={restaurant.priority}
                rating={restaurant.rating}
                reviewCount={restaurant.reviewCount}
                variant={restaurant.variant}
              />
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/editorial"
            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-surface-dark px-8 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:border-primary hover:bg-primary"
          >
            <span>Explore Full Collection</span>
            <span className="material-icons text-sm transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-surface-dark/50 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase">Main Version</p>
            <p className="mt-1 text-lg font-semibold text-white">V2 Visual Experience</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase">Backup</p>
            <p className="mt-1 text-lg font-semibold text-white">
              <Link href="/v1" className="text-primary hover:text-rose-300">
                Open V1 Catalog + Pairings
              </Link>
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase">Admin</p>
            <p className="mt-1 text-lg font-semibold text-white">
              <Link href="/v1/admin" className="text-primary hover:text-rose-300">
                Open V1 Admin Panel
              </Link>
            </p>
          </div>
        </div>
      </main>

      <div className="fixed right-8 bottom-8 z-40 hidden lg:block">
        <Link
          href="/pairing"
          className="group relative flex rounded-full bg-primary p-4 text-white shadow-2xl shadow-primary/40 transition-all hover:-translate-y-1 hover:bg-primary-dark"
        >
          <span className="material-icons text-2xl">smart_toy</span>
          <span className="pointer-events-none absolute top-1/2 right-full mr-4 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-surface-dark px-3 py-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            Ask AI Sommelier
          </span>
        </Link>
      </div>
      <MobileTabBar />
    </div>
  );
}
