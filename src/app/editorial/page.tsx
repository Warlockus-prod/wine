import Image from "next/image";
import Link from "next/link";
import MobileTabBar from "@/components/v2/MobileTabBar";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";

const CURATED_CARDS = [
  {
    name: "Nobu Downtown",
    type: "Japanese Fusion",
    rating: "4.9 ★",
    city: "New York, NY",
    price: "$$$$",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDseDTAZcitZRHkzXsKsHhp-jOt9umhbNRxomno_meIxgsK1NefFRJX1EovVzhLSFGiUrMwPGfuRjJJMD664_Pn7xTB6-mc_4TDo0sAm3B8wTgL2EffvAxJaBhSMCGYlsPY2hR_eK-WnWrxqxfSlXSb3VzUmFZpCYb0TB7Z9AHDHFOtEskRkzyDk-KP7c7vHCqMoDXoqeVRqDSmiA7EHIMXl0q3uVRe5T9t3PAauWASjlZoqP86m1lHKw8gx0ewFXvGvylT0omjxqg",
  },
  {
    name: "Carbone",
    type: "Italian American",
    rating: "4.7 ★",
    city: "New York, NY",
    price: "$$$$",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCh-Q33JDSzjDej1aHTNkn6WuaK8D55gOp3VJVwtgvgxKnnrc2OFJBmjfTcvnnJVcAn06crQBEWAkB9h1tvhbD6R0UfBiUEYCL8WoKI2LPSX6h0VC2CIAXH8cKgucw6lVTFoQaKsTLqEM1gVambebuGXZOkKQVv6inq0HIYd3fr_IAaT6Td-RCauhgjgBO7lL6_bHjITyS0NLn2JFWE_G9Ro0DCLiCeY4tPm47BaPpuTK9N15SedfEbsuM0HI22Phn-YafKmsrPfuw",
  },
  {
    name: "Eleven Madison Park",
    type: "Plant-Based Fine Dining",
    rating: "3 Michelin",
    city: "New York, NY",
    price: "$$$$$",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3vWWUS7s37idv9aV05WDijj4idyrlnRltWIZTPSwEhnnA7Nl69uHINwbZYBa350SxBOpITRAThQjnFaH9HWTRnbe5WLIzSTEIXjI_Zd_iE3YXnOLPgE4pfkJcFWgS9ohV2PmoXtUEcFlujdnNXFQwqK7VKLBuhQildUHXsDIxZlGw-66DkL6P6GzbR-Fv3nUrT_LLveey90SqZJ8tomXM3JOX5Ouix9gTZC65dRV4VCmshhWQ57reIHp8dmvTQoocX5xItUFcSK8",
  },
  {
    name: "Atomix",
    type: "Korean Tasting Menu",
    rating: "2 Michelin",
    city: "New York, NY",
    price: "$$$$",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqiNEgI7Y5H6BjO3BuAwsEoHw-2Ms_ezTXGdYHoJ1MtQ2P7KPMjMq2HNKBZ7zyjINCvjKo7TiXfLXGKpyciChF_FCj5l6pu4EDmU_8LTMCsv3R90Z8YEq4j8h2JgvC9lGBMpEdBSIQvAX8A0pcVQhZ1xUItwWdWTGub_pVRlTMm8fY6KMQZ-H6etwGmRgH1eIci-h3gL7NU6vAO8m2EWsfRXK-LwQ7nepx_hTykZHRVDKN2rc63wksmD0xXfPEWOJyYyo4gqpeEDY",
  },
];

export default function EditorialPage() {
  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col bg-background-dark text-gray-100">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 text-2xl tracking-tight">
              <span className="h-8 w-2 rounded-full bg-primary" />
              <span className="font-bold">LUX</span>
              <span>DINING</span>
            </Link>
            <div className="hidden items-center gap-8 text-sm font-medium tracking-wide text-gray-400 md:flex">
              <Link href="/" className="hover:text-primary">
                DISCOVER
              </Link>
              <Link href="/pairing" className="flex items-center gap-1 hover:text-primary">
                AI PAIRING
                <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                  BETA
                </span>
              </Link>
              <Link href="/v1" className="hover:text-primary">
                BACKUP V1
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/v1/admin"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:border-primary hover:bg-primary hover:text-white"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative flex min-h-[90vh] flex-col overflow-hidden pt-20 lg:flex-row">
        <div className="z-20 flex bg-background-dark px-6 py-16 lg:w-5/12 lg:justify-end lg:py-0 lg:pl-24 lg:pr-12">
          <div className="max-w-xl self-center">
            <div className="animate-fade-in-up mb-6 flex items-center gap-3">
              <span className="rounded bg-primary px-3 py-1 text-xs font-bold tracking-widest text-white uppercase">
                Selection of February
              </span>
              <span className="h-px w-12 bg-gray-700" />
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                New York City
              </span>
            </div>
            <h1
              className="animate-fade-in-up mb-8 text-5xl leading-tight font-light lg:text-7xl"
              style={{ animationDelay: "0.2s" }}
            >
              Le <span className="font-serif italic text-primary">Jardinier</span>
            </h1>
            <p
              className="animate-fade-in-up mb-10 max-w-md text-lg leading-relaxed text-gray-300"
              style={{ animationDelay: "0.4s" }}
            >
              Modern French cuisine focused on vegetables, sustainability and seasonality.
              A calm architecture-led dining journey.
            </p>
            <div
              className="animate-fade-in-up flex flex-col gap-4 sm:flex-row"
              style={{ animationDelay: "0.6s" }}
            >
              <Link
                href="/pairing"
                className="group flex items-center justify-center gap-3 rounded-lg bg-primary px-8 py-4 shadow-lg shadow-primary/20 transition hover:bg-red-700"
              >
                <span className="font-medium tracking-wide">Book Experience</span>
                <span className="material-icons text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/v1"
                className="group flex items-center justify-center gap-3 rounded-lg border border-white/10 px-8 py-4 transition hover:bg-white/5"
              >
                <span className="font-medium tracking-wide">View Menu</span>
                <span className="material-icons text-sm text-gray-400 transition-colors group-hover:text-primary">
                  restaurant_menu
                </span>
              </Link>
            </div>

            <div
              className="animate-fade-in-up mt-12 flex gap-8 border-t border-white/5 pt-8"
              style={{ animationDelay: "0.8s" }}
            >
              <div>
                <span className="block text-2xl font-light">1</span>
                <span className="text-xs tracking-wider text-gray-400 uppercase">Michelin Star</span>
              </div>
              <div>
                <span className="block text-2xl font-light">4.8</span>
                <span className="text-xs tracking-wider text-gray-400 uppercase">User Rating</span>
              </div>
              <div>
                <span className="block text-2xl font-light">$$$$</span>
                <span className="text-xs tracking-wider text-gray-400 uppercase">Price Range</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[48vh] overflow-hidden lg:h-auto lg:w-7/12">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-background-dark via-transparent to-transparent lg:w-32" />
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhZxDy6hqO7CNqk9-AF3FashU3VLamsUMLPv3l-xJtXmCugTxVZymPBgWqs4069aoXIDYuINpXEP4Gq7ybwc-aAmiW-AjW72Fo2TDbD1t0zfOj2tSOC4s8Z9qK_rY3zNilxIMQLKkRRJgPiCj45sZqhogNTAj5sjlu2gfWqKekffRSgf9gM2ijNH35JQ9Kh0hYxD84eKClvFnl8Q-IWMRChRx2vbGyy6cVXndYsvJaJ_nZRiKy7zSzJcdY3n_1PJBez2hWBm6d19s"
            alt="Luxury restaurant interior"
            fill
            quality={72}
            placeholder="blur"
            blurDataURL={GENERIC_BLUR_DATA_URL}
            priority
            sizes="100vw"
            className="object-cover object-center transition-transform duration-[2s] hover:scale-105"
          />

          <div className="absolute right-8 bottom-8 z-20">
            <Link href="/pairing">
              <article className="max-w-xs cursor-pointer rounded-xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md transition-transform hover:-translate-y-1">
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-1.5">
                    <span className="material-icons text-sm text-primary">auto_awesome</span>
                  </div>
                  <span className="text-xs font-bold tracking-widest text-white/90 uppercase">
                    AI Sommelier
                  </span>
                </div>
                <p className="text-sm font-light text-white">
                  &quot;The 2018 Sancerre pairs perfectly with the Vegetable Tart.&quot;
                </p>
              </article>
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden py-20">
        <div className="mx-auto mb-10 flex max-w-7xl items-end justify-between px-6">
          <div>
            <h2 className="mb-2 text-3xl font-light">Curated Selections</h2>
            <p className="font-light text-gray-400">Explore other top-rated experiences near you.</p>
          </div>
          <Link
            href="/"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-xs tracking-widest uppercase text-gray-300 transition hover:border-primary hover:text-primary md:inline-flex"
          >
            Back to Discover
          </Link>
        </div>

        <div className="carousel-mask hide-scrollbar flex gap-6 overflow-x-auto px-6 pb-10">
          {CURATED_CARDS.map((card) => (
            <article
              key={card.name}
              className="group relative aspect-[3/4] w-72 flex-none cursor-pointer overflow-hidden rounded-lg shadow-lg shadow-black/20 transition-shadow hover:shadow-primary/10 md:w-80"
            >
              <Image
                src={card.image}
                alt={card.name}
                fill
                quality={68}
                placeholder="blur"
                blurDataURL={GENERIC_BLUR_DATA_URL}
                sizes="320px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
              <div className="absolute top-4 right-4 rounded border border-white/10 bg-white/10 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {card.rating}
              </div>
              <div className="absolute bottom-0 left-0 w-full translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
                <p className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">{card.type}</p>
                <h3 className="mb-1 font-serif text-2xl italic text-white">{card.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{card.city}</span>
                  <span className="h-1 w-1 rounded-full bg-gray-500" />
                  <span>{card.price}</span>
                </div>
              </div>
            </article>
          ))}

          <Link
            href="/v1"
            className="group relative flex aspect-[3/4] w-72 flex-none flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-surface-dark/50 transition-colors hover:bg-surface-dark md:w-80"
          >
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary transition-transform group-hover:scale-110">
              <span className="material-icons">arrow_forward</span>
            </div>
            <span className="font-medium text-gray-400">Open Backup Catalog</span>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-white/5 bg-background-dark pt-16 pb-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-gray-500">© 2026 LuxDining Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/">Discover</Link>
            <Link href="/pairing">AI Pairing</Link>
            <Link href="/v1">Backup V1</Link>
          </div>
        </div>
      </footer>
      <MobileTabBar />
    </div>
  );
}
