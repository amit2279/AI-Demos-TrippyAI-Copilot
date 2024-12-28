import { Location } from '../types/chat';
import { generateImageUrl } from './imageService';
import { getCoordinates, getLocationDescription } from './locationService';

interface RawLocation {
  name: string;
  coordinates: [number, number];
  rating?: number;
  reviews?: number;
  description?: string;
  image?: string;
}

function isValidCoordinates(coords: any): coords is [number, number] {
  if (!Array.isArray(coords)) return false;
  if (coords.length !== 2) return false;
  
  const [lat, lng] = coords;
  return typeof lat === 'number' && 
         typeof lng === 'number' &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
}

export function parseJsonLocations(text: string): Location[] {
  console.log('[LocationParser] Starting JSON extraction');
  try {
    const patterns = [
      /{\s*"locations":\s*\[[\s\S]*?\]\s*}/,
      /{\s*"name":\s*"[^"]+",\s*"coordinates":\s*\[[^]]+\].*?}/g
    ];

    let locations: RawLocation[] = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (!matches) continue;

      const jsonStr = matches[0];
      try {
        const parsed = JSON.parse(jsonStr);
        locations = Array.isArray(parsed.locations) ? parsed.locations : [parsed];
        break;
      } catch (e) {
        console.warn('[LocationParser] Failed to parse JSON:', e);
        continue;
      }
    }

    if (locations.length === 0) {
      throw new Error('No valid locations found in text');
    }

    return locations.map((loc: RawLocation, index: number): Location => {
      if (!isValidCoordinates(loc.coordinates)) {
        console.error('[LocationParser] Invalid coordinates for location:', loc.name);
        throw new Error(`Invalid coordinates for location: ${loc.name}`);
      }

      return {
        id: `${Date.now()}-loc-${index}`,
        name: loc.name.trim(),
        coordinates: loc.coordinates,
        rating: Number(loc.rating) || 0,
        reviews: Number(loc.reviews) || 0,
        description: loc.description?.trim() || '',
        image: loc.image || generateImageUrl(loc.name)
      };
    });

  } catch (error) {
    console.error('[LocationParser] Error parsing locations:', error);
    throw error;
  }
}
/*export function parseJsonLocations(text: string): Location[] {
  console.log('[LocationParser] Starting JSON extraction');
  try {
    const lastBraceIndex = text.lastIndexOf('{');
    if (lastBraceIndex === -1) {
      console.log('[LocationParser] No JSON block found');
      return [];
    }

    let potentialJson = text.substring(lastBraceIndex);
    
    // Find the first complete JSON object
    let depth = 0;
    let endIndex = -1;
    
    for (let i = 0; i < potentialJson.length; i++) {
      if (potentialJson[i] === '{') depth++;
      if (potentialJson[i] === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    if (endIndex === -1) {
      console.log('[LocationParser] No complete JSON object found');
      return [];
    }

    potentialJson = potentialJson.substring(0, endIndex);
    console.log('[LocationParser] Extracted JSON:', potentialJson);

    try {
      const parsed = JSON.parse(potentialJson);
      const loc = parsed; // Single location object

      return [{
        id: `loc-${Date.now()}-0`,
        name: loc.name,
        position: {
          lat: Number(loc.coordinates[0]),
          lng: Number(loc.coordinates[1])
        },
        rating: loc.rating || 4.5,
        reviews: loc.reviews || Math.floor(Math.random() * 40000) + 10000,
        imageUrl: loc.image || generateImageUrl(loc.name),
        description: loc.description || ''
      }];
    } catch (jsonError) {
      console.error('[LocationParser] JSON parse error:', jsonError);
      console.error('[LocationParser] Problem JSON string:', potentialJson);
      return [];
    }
  } catch (error) {
    console.error('[LocationParser] Error in extraction:', error);
    return [];
  }
}
*/


export function parseTextLocations(text: string): Location[] {
  console.log('[LocationParser] Starting text-based location extraction');
  const LOCATION_PATTERN = /(\d+\.\s*)([^-\n]+?)(?:\s*-\s*([^\n.]+)[.\n]|$)/g;
  const locations: Location[] = [];
  let match;

  try {
    while ((match = LOCATION_PATTERN.exec(text)) !== null) {
      const [, , name, description] = match;
      if (!name || name.length < 2) continue;

      const cleanName = name.trim();
      console.log('[LocationParser] Found location in text:', cleanName);
      
      const coordinates = getCoordinates(cleanName);
      const knownDescription = getLocationDescription(cleanName);
      
      locations.push({
        id: `loc-${Date.now()}-${locations.length}`,
        name: cleanName,
        position: coordinates,
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 40000) + 10000,
        imageUrl: generateImageUrl(cleanName),
        description: description || knownDescription
      });
    }
  } catch (error) {
    console.error('[LocationParser] Error parsing text locations:', error);
  }

  return locations;
}


export function extractLocationsFromResponse(text: string): Location[] {
  //console.log('[LocationParser] Processing text length:', text);
  
  try {
    // Look for JSON block with proper regex
    const jsonMatch = text.match(/{\s*"locations":\s*\[([\s\S]*?)\]\s*}/);
    
    if (!jsonMatch) {
      console.log('[LocationParser] No JSON data found');
      return [];
    }

    console.log('[LocationParser] Starting JSON extraction');
    const data = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(data.locations)) {
      console.log('[LocationParser] Invalid locations data structure');
      return [];
    }

    //console.log('[LocationParser] Extracted JSON:', data);
    return data.locations.map((loc: RawLocation, index: number) => ({
      id: `loc-${Date.now()}-${index}`,
      name: loc.name,
      position: {
        lat: loc.coordinates[0],
        lng: loc.coordinates[1]
      },
      rating: loc.rating || 4.5,
      reviews: loc.reviews || Math.floor(Math.random() * 40000) + 10000,
      imageUrl: loc.image || generateImageUrl(loc.name),
      description: loc.description || `Visit ${loc.name}`
    }));
  } catch (error) {
    console.error('[LocationParser] Error parsing JSON:', error);
    return [];
  }
}


/*export function extractLocationsFromResponse(text: string): Location[] {
  console.log('[LocationParser] Processing response text length:', text.length);
  
  // Try JSON parsing first
  const jsonLocations = parseJsonLocations(text);
  if (jsonLocations.length > 0) {
    console.log('[LocationParser] Found JSON locations:', jsonLocations.length);
    return jsonLocations;
  }

  // Fall back to text parsing
  const textLocations = parseTextLocations(text);
  console.log('[LocationParser] Found text locations:', textLocations.length);
  return textLocations;
}

export function cleanChatResponse(text: string): string {
  // Remove the JSON block and any trailing content after it
  const jsonIndex = text.indexOf('{ "locations":');
  if (jsonIndex !== -1) {
    text = text.substring(0, jsonIndex);
  }
  
  // Clean up any remaining formatting issues
  return text
    .replace(/\n{3,}/g, '\n\n')  // Normalize line breaks
    .replace(/\s{2,}/g, ' ')     // Normalize spaces
    .trim();
}*/

