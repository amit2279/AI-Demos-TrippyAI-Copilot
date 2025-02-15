import React from 'react';
import { Star, MapPin, Landmark, Building, Castle, MenuIcon as Monument, Church, Replace as Palace, Mouse as Museum, Mountain, Trees as Tree, Palmtree, Tent, Warehouse, UtensilsCrossed, Waves, Umbrella, Flower2, Camera, Wine, Coffee, ShoppingBag } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface LocationRecommendationProps {
  location: Location;
  index: number;
  isVisible: boolean;
  onClick?: () => void;
}

export const LocationRecommendation: React.FC<LocationRecommendationProps> = ({ 
  location, 
  index,
  isVisible,
  onClick
}) => {
  const handleClick = () => {
    console.log('[LocationRecommendation] Card clicked:', {
      id: location.id,
      name: location.name,
      position: location.position
    });
    onClick?.();
  };

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[LocationRecommendation] Maps button clicked:', location.name);
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  // Get appropriate icon based on location name/description
  const getLocationIcon = () => {
    const nameAndDesc = (location.name + ' ' + (location.description || '')).toLowerCase();
    
    // Religious/Cultural sites
    if (nameAndDesc.includes('temple') || nameAndDesc.includes('shrine') || nameAndDesc.includes('church')) {
      return <Church className="w-8 h-8 text-amber-600" />;
    }
    
    // Historical buildings
    if (nameAndDesc.includes('castle') || nameAndDesc.includes('fort')) {
      return <Castle className="w-8 h-8 text-stone-600" />;
    }
    if (nameAndDesc.includes('palace')) {
      return <Palace className="w-8 h-8 text-purple-600" />;
    }
    if (nameAndDesc.includes('monument') || nameAndDesc.includes('memorial')) {
      return <Monument className="w-8 h-8 text-gray-600" />;
    }
    
    // Cultural institutions
    if (nameAndDesc.includes('museum')) {
      return <Museum className="w-8 h-8 text-blue-600" />;
    }
    if (nameAndDesc.includes('theater') || nameAndDesc.includes('theatre') || nameAndDesc.includes('opera')) {
      return <Ticket className="w-8 h-8 text-rose-600" />;
    }
    
    // Nature
    if (nameAndDesc.includes('mountain') || nameAndDesc.includes('peak') || nameAndDesc.includes('hill')) {
      return <Mountain className="w-8 h-8 text-emerald-700" />;
    }
    if (nameAndDesc.includes('forest') || nameAndDesc.includes('park') || nameAndDesc.includes('garden')) {
      return <Tree className="w-8 h-8 text-green-600" />;
    }
    if (nameAndDesc.includes('beach') || nameAndDesc.includes('coast')) {
      return <Palmtree className="w-8 h-8 text-orange-500" />;
    }
    if (nameAndDesc.includes('lake') || nameAndDesc.includes('river') || nameAndDesc.includes('waterfall')) {
      return <Waves className="w-8 h-8 text-blue-500" />;
    }
    
    // Recreation
    if (nameAndDesc.includes('camp') || nameAndDesc.includes('national park')) {
      return <Tent className="w-8 h-8 text-green-700" />;
    }
    if (nameAndDesc.includes('farm') || nameAndDesc.includes('vineyard') || nameAndDesc.includes('ranch')) {
      return <Flower2 className="w-8 h-8 text-green-500" />;
    }
    if (nameAndDesc.includes('viewpoint') || nameAndDesc.includes('lookout')) {
      return <Camera className="w-8 h-8 text-indigo-500" />;
    }
    
    // Urban attractions
    if (nameAndDesc.includes('restaurant') || nameAndDesc.includes('dining')) {
      return <UtensilsCrossed className="w-8 h-8 text-red-500" />;
    }
    if (nameAndDesc.includes('cafe') || nameAndDesc.includes('coffee')) {
      return <Coffee className="w-8 h-8 text-amber-700" />;
    }
    if (nameAndDesc.includes('bar') || nameAndDesc.includes('pub')) {
      return <Wine className="w-8 h-8 text-purple-500" />;
    }
    if (nameAndDesc.includes('market') || nameAndDesc.includes('shopping')) {
      return <ShoppingBag className="w-8 h-8 text-pink-500" />;
    }
    if (nameAndDesc.includes('building') || nameAndDesc.includes('tower')) {
      return <Building className="w-8 h-8 text-indigo-600" />;
    }
    
    // Beach amenities
    if (nameAndDesc.includes('beach club') || nameAndDesc.includes('resort')) {
      return <Umbrella className="w-8 h-8 text-cyan-500" />;
    }
    
    // Default icon
    return <Landmark className="w-8 h-8 text-teal-600" />;
  };

  // Format the display name to show city/landmark appropriately
  const displayName = location.name.split(',')[0];

  return (
    <div 
      className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
                 transition-all duration-500 ease-out transform hover:shadow-lg
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={handleClick}
    >
      <div className="w-24 h-24 relative bg-gray-50 flex items-center justify-center">
        <div className="transform transition-transform group-hover:scale-110">
          {getLocationIcon()}
        </div>
      </div>

      <div className="flex-1 p-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {displayName}
        </h3>
        
        <div className="flex items-center mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${
                  i < Math.floor(location.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">
            ({location.reviews.toLocaleString()})
          </span>
        </div>

        <div className="mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            onClick={handleMapsClick}
          >
            <MapPin size={14} />
            <span>View on Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  );
};




/* import React, { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface LocationRecommendationProps {
  location: Location;
  index: number;
  isVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

export const LocationRecommendation: React.FC<LocationRecommendationProps> = ({ 
  location, 
  index,
  isVisible,
  onClick,
  isSelected = false
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  // Format the display name to show city/landmark appropriately
  const displayName = location.name.split(',')[0];

  return (
    <div 
      className={`flex bg-white rounded-lg overflow-hidden cursor-pointer
                 transition-all duration-500 ease-out transform hover:shadow-lg
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                 ${isSelected ? 'bg-gray-50' : ''}`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={onClick}
    >
      <div className="w-24 h-24 relative bg-gray-100">
        {!isImageLoaded && !isImageError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img 
          src={location.imageUrl}
          alt={displayName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            setIsImageError(true);
            const target = e.target as HTMLImageElement;
            target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
          }}
        />
      </div>

      <div className="flex-1 p-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {displayName}
        </h3>
        
        
        
        {location.description && (
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
            {location.description}
          </p>
        )}



        
        <div className="flex items-center mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${
                  i < Math.floor(location.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">
            ({location.reviews.toLocaleString()})
          </span>
        </div>

        <div className="mt-2">
          <button 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            onClick={handleMapsClick}
          >
            <ExternalLink size={14} />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
}; */