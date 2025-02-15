import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';
import { cityContext } from '../../services/cityContext';

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
  const lastLocationRef = useRef<string | null>(null);
  const locationsRef = useRef<string | null>(null);

  // Handle location selection
  useEffect(() => {
    //if (locations.length === 0 || selectedLocation) return;
    console.log('[MapUpdater] locations : -------- ', locations.length);

    if (!selectedLocation) return; //|| isAnimating

    // Prevent duplicate animations for same location
    const locationKey = `${selectedLocation.position.lat},${selectedLocation.position.lng}`;
    if (locationKey === lastLocationRef.current) return;
    lastLocationRef.current = locationKey;

    // Extract city name from location
    const cityName = selectedLocation.city || extractCityName(selectedLocation.name);
    
    // Update city context
    console.log('[MapUpdater] Setting city context:------- ', selectedLocation);
    cityContext.setCurrentCity(cityName);

    console.log('[MapUpdater] Flying to selected location:', {
      name: selectedLocation.name,
      city: cityName,
      coordinates: [selectedLocation.position.lat, selectedLocation.position.lng]
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAnimating(true);
    
    try {
    /*  map.setZoom(15, { 
        animate: true,
        duration: 1
      }); */

      setTimeout(() => {
        console.log('[MapUpdater] flyTo ---------- 1 ');
        map.flyTo(
          [selectedLocation.position.lat, selectedLocation.position.lng],
          15,
          {
            duration: 1.8,
            easeLinearity: 0.25
          }
        ); 

        timeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
          console.log('[MapUpdater] Animation complete');
        }, 2500);
      }, 200);

    } catch (error) {
      console.error('[MapUpdater] Error flying to location:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map, isAnimating]);

  // Handle locations update
  useEffect(() => {
    if (locations.length === 0 || selectedLocation) return; //|| isAnimating

    const locationsKey = JSON.stringify(locations.map(loc => loc.id));
    if (locationsKey === locationsRef.current) return;
    locationsRef.current = locationsKey;

    console.log('[MapUpdater] Updating map with locations:', {
      count: locations.length,
      locations: locations.map(loc => ({
        name: loc.name,
        city: loc.city,
        coordinates: [loc.position.lat, loc.position.lng]
      }))
    });

    try {
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

      // Update city context from first location
      const firstLocation = validLocations[0];
      const cityName = firstLocation.city || extractCityName(firstLocation.name);
      console.log('[MapUpdater] Setting initial city context:', cityName);
      cityContext.setCurrentCity(cityName);
      
      setIsAnimating(true);   

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (validLocations.length === 1) {
        const location = validLocations[0];
        
        /*map.setZoom(8, { 
          animate: true,
          duration: 1
        });*/

        setTimeout(() => {
          console.log('[MapUpdater] flyTo ---------- 2 ');
          map.flyTo(
            [location.position.lat, location.position.lng],
            15,
            {
              duration: 2.5,
              easeLinearity: 0.25
            }
          );

          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
            console.log('[MapUpdater] Single location animation complete');
          }, 2500);
        }, 1000);

      } else {
        const bounds = new LatLngBounds(
          validLocations.map(loc => 
            new LatLng(loc.position.lat, loc.position.lng)
          )
        );

        console.log('[MapUpdater] Fitting bounds for multiple locations');

        /*map.setZoom(4, { 
          animate: true,
          duration: 1
        });*/

        setTimeout(() => {
          const paddedBounds = bounds.pad(0.2);
          console.log('[MapUpdater] flyToBounds ---------- 3 ');
          map.flyToBounds(paddedBounds, {
            padding: [50, 50],
            maxZoom: 16,
            duration: 2.5,
            easeLinearity: 0.25
          });

          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
            console.log('[MapUpdater] Multiple locations animation complete');
          }, 2500);
        }, 1000);
      }

    } catch (error) {
      console.error('[MapUpdater] Error updating map bounds:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, map, isAnimating, selectedLocation]);

  return null;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

function extractCityName(locationName: string): string {
  // Split by commas and take the first part
  const parts = locationName.split(',');
  
  // If it's a landmark, try to get the city from the second part
  if (parts.length > 1) {
    // Remove any leading/trailing spaces and common words
    return parts[0].trim()
      .replace(/^(in|at|near|the)\s+/i, '')
      .replace(/\s+(area|district|region)$/i, '');
  }
  
  // Otherwise, use the first part
  return parts[0].trim();
}


/*import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';
import { cityContext } from '../../services/cityContext';

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
  const initializedRef = useRef(false);

  // Handle location selection - separate effect for zoom handling
  useEffect(() => {
    if (!selectedLocation || isAnimating) return;

    // Only update city context if the location has a city attribute
    if (selectedLocation.city) {
      console.log('[MapUpdater] Setting city context from selected location:', selectedLocation.city);
      cityContext.setCurrentCity(selectedLocation.city);
    } else {
      console.log('[MapUpdater] No city attribute found for location:', selectedLocation.name);
    }

    console.log('[MapUpdater] Flying to selected location:', {
      name: selectedLocation.name,
      coordinates: [selectedLocation.position.lat, selectedLocation.position.lng]
    });
    
    setIsAnimating(true);
    
    try {
      map.flyTo(
        [selectedLocation.position.lat, selectedLocation.position.lng],
        17,
        {
          duration: 2.5,
          easeLinearity: 0.25
        }
      );

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        console.log('[MapUpdater] Animation complete');
      }, 3500);
    } catch (error) {
      console.error('[MapUpdater] Error flying to location:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedLocation, map, isAnimating]);

  // Handle initial locations update - only run once
  useEffect(() => {
    if (initializedRef.current || locations.length === 0 || isAnimating) {
      return;
    }

    console.log('[MapUpdater] Initializing map with locations:', {
      count: locations.length,
      locations: locations.map(loc => ({
        name: loc.name,
        coordinates: [loc.position.lat, loc.position.lng],
        city: loc.city
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

      // Update city context from first valid location if it has a city
      const firstLocation = validLocations[0];
      if (firstLocation.city) {
        console.log('[MapUpdater] Setting initial city context:', firstLocation.city);
        cityContext.setCurrentCity(firstLocation.city);
      } else {
        console.log('[MapUpdater] No city attribute in initial location:', firstLocation.name);
      }
      
      setIsAnimating(true);   

      if (validLocations.length === 1) {
        const location = validLocations[0];
        map.setView(
          [location.position.lat, location.position.lng],
          13,
          {
            duration: 2.5,
            easeLinearity: 0.25
          }
        );
      } else {
        const bounds = new LatLngBounds(
          validLocations.map(loc => 
            new LatLng(loc.position.lat, loc.position.lng)
          )
        );

        console.log('[MapUpdater] Fitting bounds for multiple locations:', {
          bounds: bounds.toBBoxString(),
          locations: validLocations.length
        });

        const paddedBounds = bounds.pad(0.2);
        map.fitBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 2.5,
          easeLinearity: 0.25
        });
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        initializedRef.current = true;
        console.log('[MapUpdater] Animation complete');
      }, 3500);
    } catch (error) {
      console.error('[MapUpdater] Error updating map bounds:', error);
      setIsAnimating(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locations, map, isAnimating]);

  return null;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}*/


/*import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';
import { cityContext } from '../../services/cityContext';

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

    // Only update city context if the location has a city attribute
    if (selectedLocation.city) {
      console.log('[MapUpdater] Setting city context:', selectedLocation.city);
      cityContext.setCurrentCity(selectedLocation.city);
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
          duration: 2.5, // Increased duration to 3.5 seconds
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
            duration: 2.5,
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
        map.fitBounds(paddedBounds, {
          padding: [50, 50],
          maxZoom: 13,
          duration: 2.5,
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
*/
/*import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../../types/chat';
import { LatLngBounds, LatLng } from 'leaflet';
import { cityContext } from '../../services/cityContext';


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

    if (location) {
    // Update city context when a location is selected
    const cityName = selectedLocation.name.split(',')[0].trim();
    cityContext.setCurrentCity(cityName);
    console.log("City updating in MapUpdater >>>>>>>>>>>>>>>>>>>>>> ",cityName)

    }

    
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
      //console.error('[MapUpdater] Error flying to location:', error);
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
}*/