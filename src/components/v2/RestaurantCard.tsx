import Image from "next/image";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";

type RestaurantCardProps = {
  name: string;
  image: string;
  category: string;
  rating: number;
  reviewCount?: string;
  price: string;
  location?: string;
  matchScore?: number;
  pairingAvailable?: boolean;
  className?: string;
  description?: string;
  variant?: "large" | "medium";
  priority?: boolean;
};

export default function RestaurantCard({
  name,
  image,
  category,
  rating,
  reviewCount,
  price,
  location,
  matchScore,
  pairingAvailable,
  className = "",
  description,
  variant = "medium",
  priority = false,
}: RestaurantCardProps) {
  const isLarge = variant === "large";

  return (
    <article
      className={`group card-zoom-container relative cursor-pointer rounded-2xl shadow-xl shadow-black/40 ${className}`}
    >
      <Image
        alt={name}
        className="card-zoom-image absolute inset-0 h-full w-full object-cover brightness-75 transition-all duration-500 group-hover:brightness-90"
        quality={70}
        placeholder="blur"
        blurDataURL={GENERIC_BLUR_DATA_URL}
        priority={priority}
        fill
        sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
        src={image}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-90 ${
          isLarge ? "via-background-dark/40" : "via-background-dark/20"
        }`}
      />

      <div className="absolute top-4 right-4 z-10">
        {pairingAvailable ? (
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-colors group-hover:bg-primary/90">
            <span className="material-icons text-[14px]">wine_bar</span>
            Pairing Available
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-primary/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
            <span className="material-icons text-[14px]">wine_bar</span>
            {matchScore ? `${matchScore}% Match` : "Match"}
          </span>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 z-20 w-full ${isLarge ? "p-8" : "p-6"}`}>
        <div className="flex items-end justify-between">
          <div>
            <p
              className={`mb-1 text-primary uppercase ${
                isLarge ? "mb-2 text-sm tracking-wide" : "text-xs tracking-wide"
              }`}
            >
              {category}
            </p>
            <h3 className={`${isLarge ? "text-3xl md:text-4xl" : "text-2xl"} mb-2 font-bold text-white`}>
              {name}
            </h3>
            {description ? (
              <p className="mb-2 line-clamp-1 text-sm text-gray-300">{description}</p>
            ) : null}
            <div
              className={`flex items-center text-sm text-gray-300 ${
                isLarge ? "gap-4" : "gap-3"
              }`}
            >
              <span className="flex items-center gap-1">
                <span className="material-icons text-sm text-yellow-500">star</span>
                {rating} {reviewCount ? `(${reviewCount})` : ""}
              </span>
              <span>•</span>
              <span>{price}</span>
              {location ? (
                <>
                  <span>•</span>
                  <span className={isLarge ? "text-white/80" : ""}>{location}</span>
                </>
              ) : null}
            </div>
          </div>

          {isLarge ? (
            <button
              type="button"
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-primary md:flex"
            >
              <span className="material-icons">arrow_forward</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
