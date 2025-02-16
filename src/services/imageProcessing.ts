import { Location, Message } from '../types/chat';
import { cityContext } from './cityContext';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 300; // Maximum dimension
const JPEG_QUALITY = 0.5; // JPEG quality

// Add processing state tracking
const processingImages = new Set<string>();

async function resizeImage(file: File): Promise<Blob> {
  console.log(`[Image Processing] Starting resize for ${file.name} (${file.size} bytes)`);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = (e) => {
      console.error('[Image Processing] Error loading image:', e);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function createImageMessage(file: File): Promise<Message> {
  console.log(`[Image Processing] Creating image message for ${file.name}`);
  try {
    const processedImage = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to read image'));
          return;
        }
        
        resolve({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('[Image Processing] Error creating image message:', error);
    throw error;
  }
}

// Add the parseCoordinates function
function parseCoordinates(coordinates: string): [number, number] | null {
  try {
    // Clean up the coordinates string
    const cleanCoords = coordinates.replace(/\s+/g, '').replace(/°/g, '');
    console.log('[Image Processing] Cleaned coordinates:', cleanCoords);
    
    // Split into latitude and longitude parts
    const parts = cleanCoords.split(',');
    if (parts.length !== 2) return null;

    // Parse latitude
    const latMatch = parts[0].match(/^([\d.-]+)([NS])$/);
    // Parse longitude
    const lngMatch = parts[1].match(/^([\d.-]+)([EW])$/);

    if (!latMatch || !lngMatch) return null;

    let lat = parseFloat(latMatch[1]);
    let lng = parseFloat(lngMatch[1]);

    // Adjust for hemisphere
    if (latMatch[2] === 'S') lat *= -1;
    if (lngMatch[2] === 'W') lng *= -1;

    // Validate coordinates are in valid range
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }

    return null;
  } catch (error) {
    console.error('[Image Processing] Error parsing coordinates:', error);
    return null;
  }
}

const API_URL = '/api/chat';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  console.log(`[Image Processing] Processing ${images.length} images`);
  const locations: Location[] = [];
  
  for (const image of images) {
    const imageKey = `${image.name}-${image.size}-${image.lastModified}`;
    if (processingImages.has(imageKey)) {
      console.log(`[Image Processing] Skipping duplicate processing for ${image.name}`);
      continue;
    }
    
    try {
      processingImages.add(imageKey);
      
      if (image.size > 10 * 1024 * 1024) {
        console.warn(`[Image Processing] Image too large: ${image.size} bytes`);
        continue;
      }

      const processedImage = await resizeImage(image);
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Failed to read image'));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedImage);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this location. Respond with ONLY a JSON object in this format: {"name": "Location Name", "city": "City Name", "country": "Country", "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W", "description": "Brief description"}'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      let fullResponse = '';
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body available');

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullResponse += parsed.text;
            } catch (e) {}
          }
        }
      }

      console.log('[Image Processing] Raw response:', fullResponse);

      const locationData = JSON.parse(fullResponse);
      if (!locationData.name || !locationData.coordinates || !locationData.city) {
        console.warn('[Image Processing] Missing required fields:', locationData);
        continue;
      }

      // Extract and clean city name
      const cityName = locationData.city.trim()
        .replace(/^(the|in|at|near)\s+/i, '')
        .replace(/\s+(area|district|region)$/i, '');

      console.log('[Image Processing] Setting city context:', cityName);
      cityContext.setCurrentCity(cityName);

      const coords = parseCoordinates(locationData.coordinates);
      if (!coords) {
        console.warn('[Image Processing] Failed to parse coordinates:', locationData.coordinates);
        continue;
      }

      const [lat, lng] = coords;
      locations.push({
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: locationData.name,
        country: locationData.country,
        position: { lat, lng },
        city: cityName,
        description: locationData.description,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 40000) + 10000
      });
      //imageUrl: base64Image,
    } catch (error) {
      console.error(`[Image Processing] Error:`, error);
    } finally {
      processingImages.delete(imageKey);
    }
  }

  return locations;
}





/* import { Location, Message } from '../types/chat';
import { cityContext } from './cityContext';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 800; // Maximum dimension
const JPEG_QUALITY = 0.7; // JPEG quality

// Add processing state tracking
const processingImages = new Set<string>();

async function resizeImage(file: File): Promise<Blob> {
  console.log(`[Image Processing] Starting resize for ${file.name} (${file.size} bytes)`);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      console.log(`[Image Processing] Original dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      console.log(`[Image Processing] Resized dimensions: ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          console.log(`[Image Processing] Processed size: ${blob.size} bytes`);
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = (e) => {
      console.error('[Image Processing] Error loading image:', e);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function createImageMessage(file: File): Promise<Message> {
  console.log(`[Image Processing] Creating image message for ${file.name}`);
  try {
    const processedImage = await resizeImage(file);
    console.log('[Image Processing] Image processed for message');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          console.error('[Image Processing] Failed to read processed image');
          reject(new Error('Failed to read image'));
          return;
        }
        
        const message: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        };
        
        console.log('[Image Processing] Image message created successfully');
        resolve(message);
      };
      
      reader.onerror = (error) => {
        console.error('[Image Processing] Error reading processed image:', error);
        reject(new Error('Failed to read processed image'));
      };
      
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('[Image Processing] Error creating image message:', error);
    throw error;
  }
}

function parseCoordinates(coordinates: string | unknown): [number, number] | null {
  console.log('[Image Processing] Parsing coordinates:', coordinates);
  
  try {
    if (typeof coordinates === 'string') {
      const cleanCoords = coordinates.replace(/\s+/g, '').replace(/°/g, '');
      console.log('[Image Processing] Cleaned coordinates:', cleanCoords);
      
      const parts = cleanCoords.split(',');
      console.log('[Image Processing] Split parts:', parts);
      
      if (parts.length !== 2) return null;

      const latMatch = parts[0].match(/^([\d.-]+)([NS])$/);
      const lngMatch = parts[1].match(/^([\d.-]+)([EW])$/);
      console.log('[Image Processing] Matches:', { latMatch, lngMatch });

      if (!latMatch || !lngMatch) return null;

      let lat = parseFloat(latMatch[1]);
      let lng = parseFloat(lngMatch[1]);

      if (latMatch[2] === 'S') lat *= -1;
      if (lngMatch[2] === 'W') lng *= -1;

      console.log('[Image Processing] Parsed values:', { lat, lng });
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Image Processing] Error parsing coordinates:', error);
    return null;
  }
}

const API_URL = '/api/chat';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  console.log(`[Image Processing] Processing ${images.length} images`);
  const locations: Location[] = [];
  
  for (const image of images) {
    // Check if image is already being processed
    const imageKey = `${image.name}-${image.size}-${image.lastModified}`;
    if (processingImages.has(imageKey)) {
      console.log(`[Image Processing] Skipping duplicate processing for ${image.name}`);
      continue;
    }
    
    try {
      processingImages.add(imageKey);
      
      if (image.size > 10 * 1024 * 1024) {
        console.warn(`[Image Processing] Image too large: ${image.size} bytes`);
        continue;
      }

      const processedImage = await resizeImage(image);
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Failed to read image'));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedImage);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this location. Respond with ONLY a JSON object in this format: {"name": "Location Name", "city": "City Name", "country": "Country", "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W", "description": "Brief description"}'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      let fullResponse = '';
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body available');

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullResponse += parsed.text;
            } catch (e) {}
          }
        }
      }

      console.log('[Image Processing] Raw response:', fullResponse);

      const locationData = JSON.parse(fullResponse);
      if (!locationData.name || !locationData.coordinates || !locationData.city) {
        console.warn('[Image Processing] Missing required fields:', locationData);
        continue;
      }

      // Extract and clean city name
      const cityName = locationData.city.trim()
        .replace(/^(the|in|at|near)\s+/i, '')
        .replace(/\s+(area|district|region)$/i, '');

      console.log('[Image Processing] Setting final city context:', cityName);
      cityContext.setCurrentCity(cityName);

      const coords = parseCoordinates(locationData.coordinates);
      if (!coords) {
        console.warn('[Image Processing] Failed to parse coordinates:', locationData.coordinates);
        continue;
      }

      const [lat, lng] = coords;
      locations.push({
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: locationData.name,
        country: locationData.country,
        position: { lat, lng },
        imageUrl: base64Image,
        city: cityName,
        description: locationData.description,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 40000) + 10000
      });

    } catch (error) {
      console.error(`[Image Processing] Error:`, error);
    } finally {
      processingImages.delete(imageKey);
    }
  }

  return locations;
}
 */



/* import { Location, Message } from '../types/chat';
import { cityContext } from './cityContext';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 800; // Maximum dimension
const JPEG_QUALITY = 0.7; // JPEG quality

// Add processing state tracking
const processingImages = new Set<string>();

async function resizeImage(file: File): Promise<Blob> {
  console.log(`[Image Processing] Starting resize for ${file.name} (${file.size} bytes)`);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      console.log(`[Image Processing] Original dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      console.log(`[Image Processing] Resized dimensions: ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          console.log(`[Image Processing] Processed size: ${blob.size} bytes`);
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = (e) => {
      console.error('[Image Processing] Error loading image:', e);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function createImageMessage(file: File): Promise<Message> {
  console.log(`[Image Processing] Creating image message for ${file.name}`);
  try {
    const processedImage = await resizeImage(file);
    console.log('[Image Processing] Image processed for message');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          console.error('[Image Processing] Failed to read processed image');
          reject(new Error('Failed to read image'));
          return;
        }
        
        const message: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        };
        
        console.log('[Image Processing] Image message created successfully');
        resolve(message);
      };
      
      reader.onerror = (error) => {
        console.error('[Image Processing] Error reading processed image:', error);
        reject(new Error('Failed to read processed image'));
      };
      
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('[Image Processing] Error creating image message:', error);
    throw error;
  }
}

function parseCoordinates(coordinates: string | unknown): [number, number] | null {
  console.log('[Image Processing] Parsing coordinates:', coordinates);
  
  try {
    if (typeof coordinates === 'string') {
      const cleanCoords = coordinates.replace(/\s+/g, '').replace(/°/g, '');
      console.log('[Image Processing] Cleaned coordinates:', cleanCoords);
      
      const parts = cleanCoords.split(',');
      console.log('[Image Processing] Split parts:', parts);
      
      if (parts.length !== 2) return null;

      const latMatch = parts[0].match(/^([\d.-]+)([NS])$/);
      const lngMatch = parts[1].match(/^([\d.-]+)([EW])$/);
      console.log('[Image Processing] Matches:', { latMatch, lngMatch });

      if (!latMatch || !lngMatch) return null;

      let lat = parseFloat(latMatch[1]);
      let lng = parseFloat(lngMatch[1]);

      if (latMatch[2] === 'S') lat *= -1;
      if (lngMatch[2] === 'W') lng *= -1;

      console.log('[Image Processing] Parsed values:', { lat, lng });
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Image Processing] Error parsing coordinates:', error);
    return null;
  }
}

const API_URL = process.env.NODE_ENV === 'production'
  ? '/api/chat'
  : 'http://localhost:3000/api/chat';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  console.log(`[Image Processing] Processing ${images.length} images`);
  const locations: Location[] = [];
  
  for (const image of images) {
    // Check if image is already being processed
    const imageKey = `${image.name}-${image.size}-${image.lastModified}`;
    if (processingImages.has(imageKey)) {
      console.log(`[Image Processing] Skipping duplicate processing for ${image.name}`);
      continue;
    }
    
    try {
      processingImages.add(imageKey);
      
      if (image.size > 10 * 1024 * 1024) {
        console.warn(`[Image Processing] Image too large: ${image.size} bytes`);
        continue;
      }

      const processedImage = await resizeImage(image);
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Failed to read image'));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedImage);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this location. Respond with ONLY a JSON object in this format: {"name": "Location Name", "city": "City Name", "country": "Country", "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W", "description": "Brief description"}'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      let fullResponse = '';
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body available');

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullResponse += parsed.text;
            } catch (e) {}
          }
        }
      }

      console.log('[Image Processing] Raw response:', fullResponse);

      const locationData = JSON.parse(fullResponse);
      if (!locationData.name || !locationData.coordinates || !locationData.city) {
        console.warn('[Image Processing] Missing required fields:', locationData);
        continue;
      }

      // Extract and clean city name
      const cityName = locationData.city.trim()
        .replace(/^(the|in|at|near)\s+/i, '')
        .replace(/\s+(area|district|region)$/i, '');

      console.log('[Image Processing] Setting final city context:', cityName);
      cityContext.setCurrentCity(cityName);

      const coords = parseCoordinates(locationData.coordinates);
      if (!coords) {
        console.warn('[Image Processing] Failed to parse coordinates:', locationData.coordinates);
        continue;
      }

      const [lat, lng] = coords;
      locations.push({
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: locationData.name,
        country: locationData.country,
        position: { lat, lng },
        imageUrl: base64Image,
        city: cityName,
        description: locationData.description,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 40000) + 10000
      });

    } catch (error) {
      console.error(`[Image Processing] Error:`, error);
    } finally {
      processingImages.delete(imageKey);
    }
  }

  return locations;
} */

/* import { Location, Message } from '../types/chat';
import { cityContext } from './cityContext';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 800; // Maximum dimension
const JPEG_QUALITY = 0.7; // JPEG quality

async function resizeImage(file: File): Promise<Blob> {
  console.log(`[Image Processing] Starting resize for ${file.name} (${file.size} bytes)`);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      console.log(`[Image Processing] Original dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      console.log(`[Image Processing] Resized dimensions: ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          console.log(`[Image Processing] Processed size: ${blob.size} bytes`);
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = (e) => {
      console.error('[Image Processing] Error loading image:', e);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function createImageMessage(file: File): Promise<Message> {
  console.log(`[Image Processing] Creating image message for ${file.name}`);
  try {
    const processedImage = await resizeImage(file);
    console.log('[Image Processing] Image processed for message');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          console.error('[Image Processing] Failed to read processed image');
          reject(new Error('Failed to read image'));
          return;
        }
        
        const message: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        };
        
        console.log('[Image Processing] Image message created successfully');
        resolve(message);
      };
      
      reader.onerror = (error) => {
        console.error('[Image Processing] Error reading processed image:', error);
        reject(new Error('Failed to read processed image'));
      };
      
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('[Image Processing] Error creating image message:', error);
    throw error;
  }
}

function parseCoordinates(coordinates: string | unknown): [number, number] | null {
  console.log('[Image Processing] Parsing coordinates:', coordinates);
  
  try {
    if (typeof coordinates === 'string') {
      const cleanCoords = coordinates.replace(/\s+/g, '').replace(/°/g, '');
      console.log('[Image Processing] Cleaned coordinates:', cleanCoords);
      
      const parts = cleanCoords.split(',');
      console.log('[Image Processing] Split parts:', parts);
      
      if (parts.length !== 2) return null;

      const latMatch = parts[0].match(/^([\d.-]+)([NS])$/);
      const lngMatch = parts[1].match(/^([\d.-]+)([EW])$/);
      console.log('[Image Processing] Matches:', { latMatch, lngMatch });

      if (!latMatch || !lngMatch) return null;

      let lat = parseFloat(latMatch[1]);
      let lng = parseFloat(lngMatch[1]);

      if (latMatch[2] === 'S') lat *= -1;
      if (lngMatch[2] === 'W') lng *= -1;

      console.log('[Image Processing] Parsed values:', { lat, lng });
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Image Processing] Error parsing coordinates:', error);
    return null;
  }
}

const API_URL = process.env.NODE_ENV === 'production'
  ? '/api/chat'
  : 'http://localhost:3000/api/chat';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  console.log(`[Image Processing] Processing ${images.length} images`);
  const locations: Location[] = [];
  
  for (const image of images) {
    try {
      if (image.size > 10 * 1024 * 1024) {
        console.warn(`[Image Processing] Image too large: ${image.size} bytes`);
        continue;
      }

      const processedImage = await resizeImage(image);
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Failed to read image'));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedImage);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this location. Respond with ONLY a JSON object in this format: {"name": "Location Name", "city": "City Name", "country": "Country", "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W", "description": "Brief description"}'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      let fullResponse = '';
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body available');

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullResponse += parsed.text;
            } catch (e) {}
          }
        }
      }

      console.log('[Image Processing] Raw response:', fullResponse);

      const locationData = JSON.parse(fullResponse);
      if (!locationData.name || !locationData.coordinates || !locationData.city) {
        console.warn('[Image Processing] Missing required fields:', locationData);
        continue;
      }

      // Extract and clean city name
      const cityName = locationData.city.trim()
        .replace(/^(the|in|at|near)\s+/i, '')
        .replace(/\s+(area|district|region)$/i, '');

      console.log('[Image Processing] Setting final city context:', cityName);
      cityContext.setCurrentCity(cityName);

      const coords = parseCoordinates(locationData.coordinates);
      if (!coords) {
        console.warn('[Image Processing] Failed to parse coordinates:', locationData.coordinates);
        continue;
      }

      const [lat, lng] = coords;
      locations.push({
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: locationData.name,
        country: locationData.country,
        position: { lat, lng },
        imageUrl: base64Image,
        city: cityName,
        description: locationData.description,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 40000) + 10000
      });

    } catch (error) {
      console.error(`[Image Processing] Error:`, error);
      continue;
    }
  }

  return locations;
} */

/* import { Location, Message } from '../types/chat';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 800; // Maximum dimension
const JPEG_QUALITY = 0.7; // JPEG quality

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const VISION_API_URL = process.env.NODE_ENV === 'production'
  ? '/api/chat'
  : 'http://localhost:3000/api/chat';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  try {
    const locations: Location[] = [];
    
    for (const image of images) {
      try {
        console.log('Processing image:', image.name);
        
        // Check initial file size
        if (image.size > 10 * 1024 * 1024) {
          console.warn(`Image ${image.name} is too large, skipping`);
          continue;
        }

        // Resize image
        const processedImage = await resizeImage(image);
        console.log('Image resized successfully');
        
        // Convert to base64
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error('Failed to read image'));
              return;
            }
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(processedImage);
        });

        console.log('Sending request to vision API...');

        // Set up SSE for streaming response
        const response = await fetch(VISION_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description.'
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image.split(',')[1]
                  }
                }
              ]
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        let fullResponse = '';
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullResponse += parsed.text;
                }
              } catch (e) {
                console.warn('Error parsing SSE data:', e);
              }
            }
          }
        }

        console.log('Full response:', fullResponse);

        // Extract JSON from the full response
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn('No JSON found in response');
          continue;
        }

        try {
          const locationData = JSON.parse(jsonMatch[0]);
          
          if (!locationData.name || !locationData.coordinates || !Array.isArray(locationData.coordinates)) {
            console.warn('Invalid location data format:', locationData);
            continue;
          }

          // Validate coordinates
          const [lat, lng] = locationData.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number' ||
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('Invalid coordinates:', locationData.coordinates);
            continue;
          }

          locations.push({
            id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: locationData.name,
            position: {
              lat: lat,
              lng: lng
            },
            rating: 4.5,
            reviews: 10000,
            imageUrl: base64Image,
            description: locationData.description || ''
          });

          console.log('Successfully processed location:', locationData.name);
        } catch (parseError) {
          console.error('Error parsing location data:', parseError);
          continue;
        }

        // Add delay between images
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        continue;
      }
    }

    return locations;
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}

export async function createImageMessage(file: File): Promise<Message> {
  try {
    const processedImage = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to read image'));
          return;
        }
        
        resolve({
          id: Date.now().toString(),
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('Error creating image message:', error);
    throw error;
  }
} */