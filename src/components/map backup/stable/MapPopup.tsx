import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { Popup } from 'react-leaflet';
import { Location } from '../types/chat';

interface MapPopupProps {
  location: Location;
}

export const MapPopup: React.FC<MapPopupProps> = ({ location }) => {
  return (
    <Popup className="custom-popup">
      <div className="w-64">
        <div className="flex gap-3">
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={location.imageUrl}
              alt={location.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
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
            
            <a
              href={`https://www.google.com/maps?q=${location.position.lat},${location.position.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <MapPin size={14} />
              View on Maps
            </a>
          </div>
        </div>
      </div>
    </Popup>
  );
};