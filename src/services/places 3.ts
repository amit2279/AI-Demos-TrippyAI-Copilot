import { Location } from '../types/chat';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

let mapsLoader: Loader | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let lastRequestTimestamp = 0;
const REQUEST_THROTTLE = 1000; // 1 second minimum between requests

// Cache for place results
const placeCache = new Map<string, {
  url: string;
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function initPlacesService() {
  if (!placesService) {
    if (!mapsLoader) {
      mapsLoader = new Loader({
        ...GOOGLE_MAPS_CONFIG,
        libraries: ['places']
      });
    }
    await mapsLoader.load();
    
    // Create a temporary map div for PlacesService
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
}

export async function findPlace(location: Location): Promise<string> {
  try {
    // Generate cache key
    const cacheKey = `${location.name}-${location.position.lat}-${location.position.lng}`;
    
    // Check cache first
    const cached = placeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[PlacesService] Cache hit for:', location.name);
      return cached.url;
    }

    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimestamp;
    if (timeSinceLastRequest < REQUEST_THROTTLE) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_THROTTLE - timeSinceLastRequest));
    }
    lastRequestTimestamp = Date.now();

    // Log request details for debugging
    console.log('[PlacesService] Finding place:', {
      name: location.name,
      coordinates: [location.position.lat, location.position.lng],
      timestamp: new Date().toISOString()
    });

    const service = await initPlacesService();
    
    return new Promise((resolve) => {
      // Optimize search query
      const searchQuery = location.name
        .replace(/[^\w\s,]/g, '') // Remove special characters
        .split(/\s*,\s*/)[0];     // Take only the first part before any comma
      
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query: searchQuery,
        fields: ['place_id', 'geometry'],
        locationBias: {
          center: { lat: location.position.lat, lng: location.position.lng },
          radius: 5000 // 5km radius
        }
      };

      service.findPlaceFromQuery(request, (results, status) => {
        let url: string;

        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
          url = `https://www.google.com/maps/place/?q=place_id:${results[0].place_id}`;
          console.log('[PlacesService] Found place_id:', results[0].place_id);
        } else {
          // Fallback to coordinates
          url = `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
          console.log('[PlacesService] Falling back to coordinates');
        }

        // Cache the result
        placeCache.set(cacheKey, {
          url,
          timestamp: Date.now()
        });

        resolve(url);
      });
    });
  } catch (error) {
    console.error('[PlacesService] Error:', error);
    // Fallback to coordinates
    return `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of placeCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      placeCache.delete(key);
    }
  }
}, CACHE_DURATION);






/* // src/services/places.ts
import { Location } from '../types/chat';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';

let mapsLoader: Loader | null = null;
let placesService: google.maps.places.PlacesService | null = null;

async function initPlacesService() {
  if (!placesService) {
    if (!mapsLoader) {
      mapsLoader = new Loader({
        ...GOOGLE_MAPS_CONFIG,
        libraries: ['places']
      });
    }
    await mapsLoader.load();
    
    // Create a temporary map div for PlacesService
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
}

export async function findPlace(location: Location): Promise<string> {
  try {
    const service = await initPlacesService();
    
    return new Promise((resolve) => {
      const request = {
        query: location.name,
        fields: ['place_id', 'geometry']
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
          resolve(`https://www.google.com/maps/place/?q=place_id:${results[0].place_id}`);
        } else {
          // Fallback to coordinates if no place found
          resolve(`https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`);
        }
      });
    });
  } catch (error) {
    console.error('[PlacesService] Error:', error);
    return `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
  }
}
 */