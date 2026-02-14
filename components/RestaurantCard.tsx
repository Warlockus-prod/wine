import React from 'react';

interface RestaurantCardProps {
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
  variant?: 'large' | 'medium';
}

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
  variant = 'medium',
}: RestaurantCardProps) {
  const isLarge = variant === 'large';

  return (
    <div className={`group relative rounded-2xl card-zoom-container cursor-pointer shadow-xl shadow-black/40 ${className}`}>
      <img
        alt={name}
        className="absolute inset-0 w-full h-full object-cover card-zoom-image brightness-75 group-hover:brightness-90 transition-all duration-500"
        src={image}
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-background-dark ${isLarge ? 'via-background-dark/40' : 'via-background-dark/20'} to-transparent opacity-90`}></div>

      <div className="absolute top-4 right-4 z-10">
        {pairingAvailable ? (
           <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1 border border-white/10 group-hover:bg-primary/90 transition-colors">
            <span className="material-icons text-[14px]">wine_bar</span>
            Pairing Available
          </span>
        ) : (
          <span className="bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1 border border-white/10">
            <span className="material-icons text-[14px]">wine_bar</span>
            {matchScore ? `${matchScore}% Match` : 'Match'}
          </span>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 ${isLarge ? 'p-8' : 'p-6'} w-full z-20`}>
        <div className="flex justify-between items-end">
          <div>
            <div className={`text-primary font-medium tracking-wide ${isLarge ? 'text-sm mb-2' : 'text-xs mb-1'} uppercase`}>{category}</div>
            <h3 className={`${isLarge ? 'text-3xl md:text-4xl' : 'text-2xl'} font-bold text-white mb-2`}>{name}</h3>
            {description && (
                <p className="text-gray-400 text-sm line-clamp-1 mb-2">{description}</p>
            )}
            <div className={`flex items-center gap-${isLarge ? '4' : '3'} text-sm text-gray-300`}>
              <span className="flex items-center gap-1">
                <span className="material-icons text-yellow-500 text-sm">star</span> {rating} {reviewCount && `(${reviewCount})`}
              </span>
              <span>•</span>
              <span>{price}</span>
              {location && (
                <>
                  <span>•</span>
                  <span className={isLarge ? "text-white/80" : ""}>{location}</span>
                </>
              )}
            </div>
          </div>
          {isLarge && (
            <button className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-primary text-white backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:scale-110">
                <span className="material-icons">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
