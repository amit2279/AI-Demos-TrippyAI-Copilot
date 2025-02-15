import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapInfoCard } from './MapInfoCard';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

interface MapPanelProps {
  view: 'osm' | 'google';
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation?: Location | null;
  isProcessingLocation?: boolean;
}

const ResetControl: React.FC<{ locations: Location[]; onReset: () => void }> = ({ 
  locations, 
  onReset 
}) => {
  const map = useMap();
  
  const handleReset = () => {
    if (locations.length === 0) return;
    
    const bounds = locations.reduce((bounds, location) => {
      bounds.extend([location.position.lat, location.position.lng]);
      return bounds;
    }, map.getBounds());
    
    map.flyToBounds(bounds.pad(0.2), {
      duration: 2,
      easeLinearity: 0.25
    });

    onReset();
  };

  return (
    <div className="leaflet-top leaflet-left mt-16">
      <div className="leaflet-control">
        <button
          onClick={handleReset}
          className="bg-white rounded-lg shadow-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

export const MapPanel: React.FC<MapPanelProps> = ({ 
  view,
  locations, 
  onLocationSelect,
  isLoading,
  isStreaming,
  selectedLocation,
  isProcessingLocation = false
}) => {
  const [showInfoCard, setShowInfoCard] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setShowInfoCard(true);
    }
  }, [selectedLocation]);

  const validLocations = locations.filter(loc => 
    loc.position && 
    !isNaN(loc.position.lat) && 
    !isNaN(loc.position.lng) &&
    loc.position.lat >= -90 && 
    loc.position.lat <= 90 &&
    loc.position.lng >= -180 && 
    loc.position.lng <= 180
  );

  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  const tileLayer = view === 'osm' ? (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  ) : (
    <TileLayer
      url="https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      maxZoom={20}
      attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    />
  );

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      id: location.id,
      name: location.name,
      position: location.position
    });
    
    onLocationSelect(location);
    setShowInfoCard(true);
  };

  const handleCloseInfoCard = () => {
    console.log('[MapPanel] Closing info card');
    setShowInfoCard(false);
    onLocationSelect(null);
  };

  return (
    <div className="h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        minZoom={2}
        ref={mapRef}
      >
        {tileLayer}
        <MapUpdater 
          locations={validLocations} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={validLocations} 
          onReset={() => {
            console.log('[MapPanel] Reset view clicked');
            onLocationSelect(null);
            setShowInfoCard(false);
          }} 
        />
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                console.log('[MapPanel] Raw marker click:', {
                  id: location.id,
                  name: location.name
                });
                handleMarkerClick(location);
              }
            }}
          />
        ))}
      </MapContainer>
      
      {isProcessingLocation && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Discovering locations...</span>
            </div>
          </div>
        </div>
      )}

      <MapInfoCard 
        location={showInfoCard ? selectedLocation : null}
        onClose={handleCloseInfoCard}
      />
    </div>
  );
};



/* import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Location } from '../types/chat';
import { MapUpdater } from './map/MapUpdater';
import { MapPopup } from './MapPopup';
import { MapToggle } from './MapToggle';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

interface MapPanelProps {
  view: 'osm' | 'google';
  locations: Location[];
  onLocationSelect: (location: Location | null) => void;
  isLoading: boolean;
  isStreaming: boolean;
  selectedLocation?: Location | null;
  isProcessingLocation?: boolean;
}

const ResetControl: React.FC<{ locations: Location[]; onReset: () => void }> = ({ 
  locations, 
  onReset 
}) => {
  const map = useMap();
  
  const handleReset = () => {
    if (locations.length === 0) return;
    
    const bounds = locations.reduce((bounds, location) => {
      bounds.extend([location.position.lat, location.position.lng]);
      return bounds;
    }, map.getBounds());
    
    map.flyToBounds(bounds.pad(0.2), {
      duration: 2,
      easeLinearity: 0.25
    });

    onReset();
  };

  return (
    <div className="leaflet-top leaflet-left mt-16">
      <div className="leaflet-control">
        <button
          onClick={handleReset}
          className="bg-white rounded-lg shadow-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

export const MapPanel: React.FC<MapPanelProps> = ({ 
  view,
  locations, 
  onLocationSelect,
  isLoading,
  isStreaming,
  selectedLocation,
  isProcessingLocation = false
}) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Debug logs for props changes
  useEffect(() => {
    console.log('[MapPanel] Props updated:', {
      locationsCount: locations.length,
      selectedLocation: selectedLocation?.name,
      activePopup
    });
  }, [locations, selectedLocation, activePopup]);

  const validLocations = locations.filter(loc => 
    loc.position && 
    !isNaN(loc.position.lat) && 
    !isNaN(loc.position.lng) &&
    loc.position.lat >= -90 && 
    loc.position.lat <= 90 &&
    loc.position.lng >= -180 && 
    loc.position.lng <= 180
  );

  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  const tileLayer = view === 'osm' ? (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  ) : (
    <TileLayer
      url="https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      maxZoom={20}
      attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    />
  );

  const handleMarkerClick = (location: Location) => {
    console.log('[MapPanel] Marker clicked:', {
      locationName: location.name,
      currentPopup: activePopup
    });

    // Always set both popup and location on click
    setActivePopup(location.id);
    onLocationSelect(location);
  };

  return (
    <div className="h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        minZoom={2}
        ref={mapRef}
      >
        {tileLayer}
        <MapUpdater 
          locations={validLocations} 
          selectedLocation={selectedLocation}
        />
        <ResetControl 
          locations={validLocations} 
          onReset={() => {
            onLocationSelect(null);
            //setActivePopup(null);
          }} 
        />
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.position.lat, location.position.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                console.log('[MapPanel] Raw marker click:', location.name);
                handleMarkerClick(location);
              }
            }}
          >
            {activePopup === location.id && (
              <MapPopup 
                location={location} 
              />
            )}
          </Marker>
        ))}
      </MapContainer>
      
      {isProcessingLocation && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 font-medium">Discovering locations...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; */