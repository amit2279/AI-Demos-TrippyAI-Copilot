import React, { useRef } from 'react';
import { MapPin, Star, X } from 'lucide-react';
import { Location } from '../types/chat';

interface EarthPopupProps {
  location: Location;
  position: { x: number; y: number };
  onClose: () => void;
  onSelect: () => void;
  onOpenMaps: () => void;
}

export const EarthPopup: React.FC<EarthPopupProps> = ({
  location,
  position,
  onClose,
  onSelect,
  onOpenMaps
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const adjustedPosition = React.useMemo(() => {
    if (!popupRef.current) return position;

    const rect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 20;
    }
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 20;
    }

    return { x, y };
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="earth-popup absolute bg-white rounded-lg shadow-lg p-3 z-50"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        minWidth: '280px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>

      <div className="flex gap-3">
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(
                location.name + ' landmark'
              )}`;
            }}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{location.name}</h3>

          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">
              {location.rating} ({location.reviews.toLocaleString()} reviews)
            </span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={onSelect}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <MapPin size={14} />
              View Details
            </button>
            <button
              onClick={onOpenMaps}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <MapPin size={14} />
              Open in Maps 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};