/*import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Location } from '../../types/chat';
import { icon } from 'leaflet';
import { useMapMarkers } from './useMapMarkers';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapMarkers: React.FC<{
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  selectedLocation: Location | null;
}> = ({ locations, onLocationSelect, selectedLocation }) => {
  const { markers, handleMarkerClick } = useMapMarkers(locations, onLocationSelect);

  return (
    <>
      {markers.map((location) => (
        <Marker
          key={location.id}
          position={[location.position.lat, location.position.lng]}
          icon={defaultIcon}
          eventHandlers={{
            click: () => handleMarkerClick(location)
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold">{location.name}</h3>
              <p className="text-sm text-gray-600">{location.description}</p>
              <button
                onClick={() => onLocationSelect(location)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};*/

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Location } from '../../types/chat';
import { icon } from 'leaflet';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { findPlace } from '../../services/places';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapMarkersProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  locations,
  onLocationSelect,
  selectedLocation
}) => {
  const handleOpenMaps = async (location: Location, e: React.MouseEvent) => {
    e.stopPropagation();
    const mapsUrl = await findPlace(location);
    window.open(mapsUrl, '_blank');
  };

  console.log('[MapMarkers] : -------- ', MapMarkers);

  return (
    <>
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.position.lat, location.position.lng]}
          icon={defaultIcon}
          eventHandlers={{
            click: () => onLocationSelect(location)
          }}
        >
          <Popup className="custom-popup">
            <div className="min-w-[280px] max-w-[320px]">
              <div className="flex gap-3">
                <div className="w-24 h-24 flex-shrink-0">
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
                  <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                  
                  <div className="flex items-center gap-1 mt-1">
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

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {location.description}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onLocationSelect(location)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <MapPin size={14} />
                      View Details
                    </button>
                    <button
                      onClick={(e) => handleOpenMaps(location, e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Open in Maps 
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};