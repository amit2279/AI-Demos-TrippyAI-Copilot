import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';

interface MapUpdaterProps {
  locations: Location[];
  selectedLocation?: Location | null;
}

export const MapUpdater: React.FC<MapUpdaterProps> = ({ 
  locations, 
  selectedLocation 
}) => {
  const map = useMap();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Handle location selection - separate effect for zoom handling
  useEffect(() => {
    if (!selectedLocation) return;

    const { lat, lng } = selectedLocation.position;
    if (!isValidCoordinates(lat, lng)) {
      console.error('[MapUpdater] Invalid coordinates for selected location:', {
        name: selectedLocation.name,
        coordinates: [lat, lng]
      });
      return;
    }

    console.log('[MapUpdater] Flying to selected location:', {
      name: selectedLocation.name,
      coordinates: [lat, lng]
    });
    
    setIsAnimating(true);
    
    try {
      map.flyTo(
        [lat, lng],
        17, // Increased zoom level for location cards
        {
          duration: 3.5, // Increased duration to 3.5 seconds
          easeLinearity: 0.25
        }
      );

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        console.log('[MapUpdater] Animation complete');
      }, 3500); // Match timeout with duration
    } catch (error) {
      console.error('[MapUpdater] Error flying to location:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map]);

  // Handle locations update - separate effect for initial view
  useEffect(() => {
    if (locations.length === 0 || selectedLocation) return;

    console.log('[MapUpdater] Received locations update:', {
      count: locations.length,
      locations: locations.map(loc => ({
        name: loc.name,
        coordinates: [loc.position.lat, loc.position.lng]
      }))
    });

    try {
      // Filter valid locations
      const validLocations = locations.filter(loc => {
        const isValid = loc?.position?.lat != null && 
                       loc?.position?.lng != null &&
                       isValidCoordinates(loc.position.lat, loc.position.lng);
        
        if (!isValid) {
          console.warn('[MapUpdater] Invalid location:', {
            name: loc.name,
            position: loc.position
          });
        }
        return isValid;
      });

      if (validLocations.length === 0) {
        console.warn('[MapUpdater] No valid locations to update');
        return;
      }
      
      setIsAnimating(true);   

      if (validLocations.length === 1) {
        const location = validLocations[0];
        console.log('[MapUpdater] Flying to single location:', {
          name: location.name,
          coordinates: [location.position.lat, location.position.lng]
        });

        map.flyTo(
          [location.position.lat, location.position.lng],
          13,
          {
            duration: 3.5, // Increased duration to 3.5 seconds
            easeLinearity: 0.25
          }
        );
      } else {
        const bounds = new LatLngBounds(
          validLocations.map(loc => 
            new LatLng(loc.position.lat, loc.position.lng)
          )
        );

        console.log('[MapUpdater] Flying to bounds:', {
          bounds: bounds.toBBoxString(),
          locations: validLocations.length
        });

        const paddedBounds = bounds.pad(0.2);
        map.flyToBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 3.5, // Increased duration to 3.5 seconds
          easeLinearity: 0.25
        });
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        console.log('[MapUpdater] Animation complete');
      }, 3500); // Match timeout with duration
    } catch (error) {
      console.error('[MapUpdater] Error updating map bounds:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, map, selectedLocation]);

  return null;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}