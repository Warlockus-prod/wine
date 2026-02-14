import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import RestaurantCard from '@/components/RestaurantCard';

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display transition-colors duration-300 antialiased min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <HeroSection />

        {/* The Pentad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] md:auto-rows-[380px]">
            {/* Card 1: Large Feature (French) */}
            <div className="md:col-span-8 h-full">
                <RestaurantCard
                    name="Le Jardin Secret"
                    category="French Haute Cuisine"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuA_WsNRlCkrY0Hi6HbdTxkCN-gPKhUELj6V4N13LtRzIIvJHXSD_GZCGnnB0r8sSluauD9WMmaTPMQg70BHyuYJOqN1Ry7ovxyQsIODPhGC5BgMeTV2JDv15Zpt2JDhdUaYOr2sMPSKPZtXTO9XrhnT6YvDPvoBD0WtPdfJb781RkBnZ98miqXw_R8fIaCQDjToQI8mto7dpu1IWl6860OvaifOhvgC6G0G3VUig5oVS4_4mc7VarC4wEN5AVakXwE0W-eBbfMX8SU"
                    rating={4.9}
                    reviewCount="1.2k"
                    price="$$$$"
                    location="Paris, 1st Arr."
                    matchScore={98}
                    variant="large"
                    className="h-full"
                />
            </div>

            {/* Card 2: Medium Vertical (Steakhouse) */}
            <div className="md:col-span-4 h-full">
                <RestaurantCard
                    name="Prime Cut"
                    category="Premium Steakhouse"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuDrLIJvR2jp46jBv7TXMChcLgX2UReFF1Fk7Rt7csGnNsIMWhuy4vCq-9yMJVtMuojNjuqIUPL70hzZ-2dzW3HlQWtECvzS87uhD5vxRk4ULntq8hm53Ck1GfUmgnAK5sVucLtoNmnf4nl6Rkv2Jil4R_JD0PSA2_3HwKccVONp7CVww-wJzgmclcraxkDZRA_0CxZPHEVMnnLltOiOY1FPfIaZ0bE-WgIaBTJ4RYxrEQ1Vurj3a3_7DlZ6ysgs-plY70KtSD_vueE"
                    rating={4.8}
                    price="$$$$"
                    matchScore={95}
                    className="h-full"
                />
            </div>

            {/* Card 3: Medium (Seafood) */}
            <div className="md:col-span-5 h-full">
                <RestaurantCard
                    name="Ocean Blue"
                    category="Seafood & Raw Bar"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuBFIH_US2kPRd6ak8QMLVdxkuQeaTnAhmHBTdBEOmSDGpejB2oVXasKCWEQ7UcA6pUWxlBQLUIJVOV7sXP-3_RxpPoSzoIqpweJcqzdYH8Go8MHITphD1UVNOE0EMQdrEk5F3UNX4nGjKPQC3dwVXQFxHs97-CKs4cfzJ_rk1kCvL1GjfC4dBJmAUW_md9ZXH-0iZ5szzfCQkbAzOUFk2PGVTmqzVCgLGp-95Z70vR-MPi4iWHqzS4gGlcNDcF8rKYeS7oqfl6-9Oo"
                    rating={4.7}
                    price="$$$"
                    pairingAvailable={true}
                    description="Fresh catch daily, flown in from Tsukiji Market."
                    className="h-full"
                />
            </div>

            {/* Card 4: Medium (Italian) */}
            <div className="md:col-span-4 h-full">
                <RestaurantCard
                    name="Trattoria Roma"
                    category="Authentic Italian"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuDL71yH65d9VuJsLEPyWfhQUss_EpKDl1aAl8r-1AM21GCm0EFY8rjoFOhtpwXA07Ylg3NB0UeLtnjb-l6BaothY4Zd5S2QdXMXsHkK9DUOSgKFg0ILWhPTwpgXJcrjEPiuVSLb52QixBkaW2g2rUanRW0Zdvkze5q7itU1y4i1DIE0IaXkCciSa-giGNqSArQPS2dH-ojEDR6R3ejMm38UcaOw5YBEc1VX_hpmUWr3Cv1Ue9oKALDpVR9S_jBUVbwemmkrgG95Zvw"
                    rating={4.6}
                    price="$$"
                    matchScore={92}
                    className="h-full"
                />
            </div>

            {/* Card 5: Medium (Asian) */}
            <div className="md:col-span-3 h-full">
                <RestaurantCard
                    name="Zen"
                    category="Modern Asian Fusion"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuDv_XOZnfkhjFYA1vWahUlwvnT5k0vlcZaO-sS9uTfmQtJyElk_a-HyOxsrnqytDKmd2RK7e_W2gmvtGjAgYsWqvx6LvJFfQdELfEc8GytEMWKmsyndrgcuEn8D8h3NkhZPxNF6vQNgwQR-YMov39sPrdHY1yZ9AhFFi2Y0qO9RwnBm0na_kpTXgsedfBBdf6m9_snQdq9h9iB3Iqy6Y0cQeL4H30cq2pzgD6wTjQllsZwwDR4an1YND2N44lLHnQKjA6454ae0HlE"
                    rating={4.8}
                    price="$$$"
                    pairingAvailable={true}
                    className="h-full"
                />
            </div>
        </div>

        {/* Pagination / More Action */}
        <div className="flex justify-center mt-12">
            <button className="group flex items-center gap-2 px-8 py-3 rounded-xl border border-white/10 bg-surface-dark hover:bg-primary hover:border-primary transition-all duration-300 text-white font-medium shadow-lg">
                <span>Explore Full Collection</span>
                <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
        </div>
      </main>

      {/* Footer Action */}
      <div className="fixed bottom-8 right-8 z-40 hidden lg:block">
        <button className="relative group bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl shadow-primary/40 transition-all hover:-translate-y-1">
            <span className="material-icons text-2xl">smart_toy</span>
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-surface-dark text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Ask AI Sommelier
            </span>
        </button>
      </div>
    </div>
  );
}
