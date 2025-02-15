import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Landmark, Building, Castle, MenuIcon as Monument, Church, Replace as Palace, Mouse as Museum, Mountain, Trees as Tree, Palmtree, Tent, Warehouse, UtensilsCrossed, Waves, Umbrella, Flower2, Camera, Wine, Coffee, ShoppingBag, Ticket } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface MapInfoCardProps {
  location: Location | null;
  onClose: () => void;
}

export const MapInfoCard: React.FC<MapInfoCardProps> = ({ location, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (location) {
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [location]);

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!location) return;
    
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('[MapInfoCard] Error opening maps:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Get appropriate icon based on location name/description
  const getLocationIcon = () => {
    if (!location) return null;
    
    const nameAndDesc = (location.name + ' ' + (location.description || '')).toLowerCase();
    
    // Religious/Cultural sites
    if (nameAndDesc.includes('temple') || nameAndDesc.includes('shrine') || nameAndDesc.includes('church')) {
      return <Church className="w-12 h-12 text-amber-600" />;
    }
    
    // Historical buildings
    if (nameAndDesc.includes('castle') || nameAndDesc.includes('fort')) {
      return <Castle className="w-12 h-12 text-stone-600" />;
    }
    if (nameAndDesc.includes('palace')) {
      return <Palace className="w-12 h-12 text-purple-600" />;
    }
    if (nameAndDesc.includes('monument') || nameAndDesc.includes('memorial')) {
      return <Monument className="w-12 h-12 text-gray-600" />;
    }
    
    // Cultural institutions
    if (nameAndDesc.includes('museum')) {
      return <Museum className="w-12 h-12 text-blue-600" />;
    }
    if (nameAndDesc.includes('theater') || nameAndDesc.includes('theatre') || nameAndDesc.includes('opera')) {
      return <Ticket className="w-12 h-12 text-rose-600" />;
    }
    
    // Nature
    if (nameAndDesc.includes('mountain') || nameAndDesc.includes('peak') || nameAndDesc.includes('hill')) {
      return <Mountain className="w-12 h-12 text-emerald-700" />;
    }
    if (nameAndDesc.includes('forest') || nameAndDesc.includes('park') || nameAndDesc.includes('garden')) {
      return <Tree className="w-12 h-12 text-green-600" />;
    }
    if (nameAndDesc.includes('beach') || nameAndDesc.includes('coast')) {
      return <Palmtree className="w-12 h-12 text-orange-500" />;
    }
    if (nameAndDesc.includes('lake') || nameAndDesc.includes('river') || nameAndDesc.includes('waterfall')) {
      return <Waves className="w-12 h-12 text-blue-500" />;
    }
    
    // Recreation
    if (nameAndDesc.includes('camp') || nameAndDesc.includes('national park')) {
      return <Tent className="w-12 h-12 text-green-700" />;
    }
    if (nameAndDesc.includes('farm') || nameAndDesc.includes('vineyard') || nameAndDesc.includes('ranch')) {
      return <Flower2 className="w-12 h-12 text-green-500" />;
    }
    if (nameAndDesc.includes('viewpoint') || nameAndDesc.includes('lookout')) {
      return <Camera className="w-12 h-12 text-indigo-500" />;
    }
    
    // Urban attractions
    if (nameAndDesc.includes('restaurant') || nameAndDesc.includes('dining')) {
      return <UtensilsCrossed className="w-12 h-12 text-red-500" />;
    }
    if (nameAndDesc.includes('cafe') || nameAndDesc.includes('coffee')) {
      return <Coffee className="w-12 h-12 text-amber-700" />;
    }
    if (nameAndDesc.includes('bar') || nameAndDesc.includes('pub')) {
      return <Wine className="w-12 h-12 text-purple-500" />;
    }
    if (nameAndDesc.includes('market') || nameAndDesc.includes('shopping')) {
      return <ShoppingBag className="w-12 h-12 text-pink-500" />;
    }
    if (nameAndDesc.includes('building') || nameAndDesc.includes('tower')) {
      return <Building className="w-12 h-12 text-indigo-600" />;
    }
    
    // Beach amenities
    if (nameAndDesc.includes('beach club') || nameAndDesc.includes('resort')) {
      return <Umbrella className="w-12 h-12 text-cyan-500" />;
    }
    
    // Default icon
    return <Landmark className="w-12 h-12 text-teal-600" />;
  };

  if (!location) return null;

  const displayName = location.name.split(',')[0].trim();
  const hasValidDescription = location.description && 
                            location.description !== 'No description' &&
                            location.description.trim() !== '';

  return (
    <div 
      className={`fixed bottom-0 left-[400px] right-0 transform transition-all duration-300 ease-out
                  ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                  ${isClosing ? 'pointer-events-none' : ''}`}
      style={{ zIndex: 9999 }}
    >
      <div className="mx-8 mb-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
          <div className="relative p-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>

            <div className="flex gap-4">
              <div className="w-32 h-32 flex-shrink-0 relative bg-gray-50 rounded-lg 
                            flex items-center justify-center">
                {getLocationIcon()}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {displayName}
                </h2>
                
                <div className="flex items-center gap-1 mb-2">
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
                
                {hasValidDescription && (
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {location.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMapsClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg 
                             hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <MapPin size={16} />
                    View on Google Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* import React, { useEffect, useState } from 'react';
import { X, MapPin, Star } from 'lucide-react';
import { Location } from '../types/chat';
import { findPlace } from '../services/places';

interface MapInfoCardProps {
  location: Location | null;
  onClose: () => void;
}

export const MapInfoCard: React.FC<MapInfoCardProps> = ({ location, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (location) {
      setIsClosing(false);
      setIsImageLoaded(false);
      setIsImageError(false);
      setRetryCount(0);
      
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [location]);

  const handleMapsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!location) return;
    
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('[MapInfoCard] Error opening maps:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    if (retryCount >= MAX_RETRIES) {
      console.log('[MapInfoCard] Max retries reached, using fallback image');
      setIsImageError(true);
      target.onerror = null; // Prevent further retries
      target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop';
      return;
    }

    setRetryCount(prev => prev + 1);
    console.log(`[MapInfoCard] Image retry ${retryCount + 1}/${MAX_RETRIES} for:`, location?.name);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location?.name + ' landmark')}&t=${timestamp}`;
  };

  if (!location) return null;

  const displayName = location.name.split(',')[0].trim();
  const hasValidDescription = location.description && 
                            location.description !== 'No description' &&
                            location.description.trim() !== '';

  return (
    <div 
      className={`fixed bottom-0 left-[400px] right-0 transform transition-all duration-300 ease-out
                  ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                  ${isClosing ? 'pointer-events-none' : ''}`}
      style={{ zIndex: 9999 }}
    >
      <div className="mx-8 mb-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
          <div className="relative p-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>

            <div className="flex gap-4">
              <div className="w-32 h-32 flex-shrink-0 relative bg-gray-100 rounded-lg overflow-hidden">
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
                  onError={handleImageError}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {displayName}
                </h2>
                
                <div className="flex items-center gap-1 mb-2">
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
                
                {hasValidDescription && (
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {location.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMapsClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg 
                             hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <MapPin size={16} />
                    View on Google Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; */