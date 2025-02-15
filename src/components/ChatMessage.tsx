import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { processStreamingMessage } from '../services/chat/messageProcessor';
import { DefaultWeatherWidget } from './weather/DefaultWeatherWidget';
import { cityContext } from '../services/cityContext';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onLocationsUpdate: (locations: Location[]) => void;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

function extractCityName(location: Location): string {
  if (location.city) {
    return location.city.trim();
  }

  const parts = location.name.split(',');
  
  if (parts.length > 1) {
    return parts[0].trim()
      .replace(/^(in|at|near|the)\s+/i, '')
      .replace(/\s+(area|district|region)$/i, '');
  }
  
  return parts[0].trim();
}

export function ChatMessage({ 
  message,
  onLocationsUpdate,
  isStreaming = false,
  onLocationSelect,
  selectedLocation
}: ChatMessageProps) {
  const [displayContent, setDisplayContent] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<string | null>(null);
  const isBot = message.sender === 'bot';
  const processedRef = useRef(false);
  const lastProcessedContentRef = useRef('');

  useEffect(() => {
    // Reset processed state when message changes
    if (message.content !== lastProcessedContentRef.current) {
      processedRef.current = false;
      lastProcessedContentRef.current = message.content;
    }

    // Don't process empty content
    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    // Handle image messages
    if (message.type === 'image') {
      setDisplayContent('');
      return;
    }

    try {
      const { textContent, jsonContent, weatherLocation } = processStreamingMessage(message.content);
      
      // Handle weather queries
      if (weatherLocation) {
        setWeatherLocation(weatherLocation);
        setDisplayContent(textContent);
        return;
      }

      // Update display content
      if (textContent) {
        setDisplayContent(textContent.trim());
      }

      // Process locations if JSON content exists and not streaming
      if (jsonContent && !isStreaming && !processedRef.current) {
        try {
          const data = JSON.parse(jsonContent);
          if (data.locations && Array.isArray(data.locations)) {
            const processedLocations = data.locations
              .filter(loc => loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2)
              .map((loc: any, index: number) => ({
                id: `loc-${Date.now()}-${index}`,
                name: loc.name,
                city: loc.city,
                country: loc.country,
                position: {
                  lat: Number(loc.coordinates[0]),
                  lng: Number(loc.coordinates[1])
                },
                rating: loc.rating || 4.5,
                reviews: loc.reviews || 1000,
                imageUrl: loc.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(loc.name + ' landmark')}`,
                description: loc.description || ''
              }));

            if (processedLocations.length > 0) {
              console.log('[ChatMessage] Processing locations:', processedLocations);
              
              // Update city context
              const cityName = extractCityName(processedLocations[0]);
              cityContext.setCurrentCity(cityName);
              
              // Mark as processed to prevent duplicate processing
              processedRef.current = true;
              
              // Update locations in parent component first
              onLocationsUpdate(processedLocations);
              
              // Then update local state
              setLocations(processedLocations);
              
              // Show locations and select first one after a short delay
              setTimeout(() => {
                setShowLocations(true);
                onLocationSelect(processedLocations[0]);
              }, 100);
            }
          }
        } catch (error) {
          console.error('[ChatMessage] Error parsing locations:', error);
        }
      }
    } catch (error) {
      console.error('[ChatMessage] Error processing message:', error);
      if (message.content) {
        setDisplayContent(message.content);
      }
    }
  }, [message, isStreaming, onLocationSelect, onLocationsUpdate]);

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Compass size={18} className="text-gray-600" />
          ) : (
            <MessageCircle size={18} className="text-blue-600" />
          )}
        </div>
        
        <div className="max-w-[100%] space-y-4 relative">
          {message.type === 'image' && message.imageUrl && (
            <div className="rounded-lg overflow-hidden max-w-[200px]">
              <img 
                src={message.imageUrl} 
                alt="Uploaded location" 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {displayContent && (
            <div className={`rounded-lg p-3 ${isBot ? 'bg-gray-100' : 'bg-blue-50'}`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayContent}
                </ReactMarkdown>
                {isBot && isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}

          {isBot && weatherLocation && !isStreaming && (
            <div className="rounded-lg">
              <DefaultWeatherWidget location={weatherLocation} />
            </div>
          )}
        </div>
      </div>

      {isBot && locations.length > 0 && showLocations && (
        <div className="ml-11 space-y-2">
          {locations.map((location, index) => (
            <LocationRecommendation
              key={location.id}
              location={location}
              index={index}
              isVisible={showLocations}
              onClick={() => onLocationSelect(location)}
              isSelected={selectedLocation?.id === location.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}









/* import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Compass } from 'lucide-react';
import { Message, Location } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocationRecommendation } from './LocationRecommendation';
import { processStreamingMessage } from '../services/chat/messageProcessor';
import { DefaultWeatherWidget } from './weather/DefaultWeatherWidget';
import { cityContext } from '../services/cityContext';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onLocationsUpdate: (locations: Location[]) => void;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

function extractCityName(location: Location): string {
  // If city is directly provided, use it
  if (location.city) {
    return location.city.trim();
  }

  // Otherwise extract from location name
  const parts = location.name.split(',');
  
  // If multiple parts, use the first part as it's likely the city
  if (parts.length > 1) {
    return parts[0].trim()
      .replace(/^(in|at|near|the)\s+/i, '')
      .replace(/\s+(area|district|region)$/i, '');
  }
  
  // If single part, use it as is
  return parts[0].trim();
}

export function ChatMessage({ 
  message,
  onLocationsUpdate,
  isStreaming = false,
  onLocationSelect,
  selectedLocation
}: ChatMessageProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<string | null>(null);
  const isBot = message.sender === 'bot';
  const processedRef = useRef(false);

  useEffect(() => {
    // Reset processed state when message changes
    if (message.content !== displayContent) {
      processedRef.current = false;
    }

    if (!message.content) {
      setDisplayContent(isStreaming ? 'Thinking...' : '');
      return;
    }

    // Handle image messages
    if (message.type === 'image') {
      setDisplayContent('');
      return;
    }

    try {
      const { textContent, jsonContent, weatherLocation } = processStreamingMessage(message.content);
      
      // Only show text content, never raw JSON
      setDisplayContent(textContent || (isStreaming ? 'Thinking...' : ''));
      
      if (weatherLocation) {
        setWeatherLocation(weatherLocation);
        return; // Don't process locations for weather messages
      }

      // Process locations if JSON content exists and not streaming
      if (jsonContent && !isStreaming && !processedRef.current) {
        try {
          const data = JSON.parse(jsonContent);
          if (data.locations && Array.isArray(data.locations)) {
            const processedLocations = data.locations
              .filter(loc => loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2)
              .map((loc: any, index: number) => ({
                id: `loc-${Date.now()}-${index}`,
                name: loc.name,
                city: loc.city,
                country: loc.country,
                position: {
                  lat: Number(loc.coordinates[0]),
                  lng: Number(loc.coordinates[1])
                },
                rating: loc.rating || 4.5,
                reviews: loc.reviews || 1000,
                imageUrl: loc.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(loc.name + ' landmark')}`,
                description: loc.description || ''
              }));

            if (processedLocations.length > 0) {
              // Update city context with first location
              const cityName = extractCityName(processedLocations[0]);
              cityContext.setCurrentCity(cityName);
              
              // Update locations
              onLocationsUpdate(processedLocations);
              setLocations(processedLocations);
              processedRef.current = true;

              // Show locations after a delay
              setTimeout(() => {
                setShowLocations(true);
                onLocationSelect(processedLocations[0]);
              }, 500);
            }
          }
        } catch (error) {
          console.error('[ChatMessage] Error parsing locations:', error);
          setLocations([]);
        }
      }
    } catch (error) {
      console.error('[ChatMessage] Error processing message:', error);
      setDisplayContent(message.content);
    }
  }, [message, isStreaming, onLocationSelect, onLocationsUpdate, displayContent]);

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Compass size={18} className="text-gray-600" />
          ) : (
            <MessageCircle size={18} className="text-blue-600" />
          )}
        </div>
        
        <div className="max-w-[100%] space-y-4 relative">
          {message.type === 'image' && message.imageUrl && (
            <div className="rounded-lg overflow-hidden max-w-[200px]">
              <img 
                src={message.imageUrl} 
                alt="Uploaded location" 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {displayContent && (
            <div className={`rounded-lg p-3 ${isBot ? 'bg-gray-100' : 'bg-blue-50'}`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayContent}
                </ReactMarkdown>
                {isBot && isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}

          {isBot && weatherLocation && !isStreaming && (
            <div className="rounded-lg">
              <DefaultWeatherWidget location={weatherLocation} />
            </div>
          )}
        </div>
      </div>

      {isBot && locations.length > 0 && showLocations && (
        <div className="ml-11 space-y-2">
          {locations.map((location, index) => (
            <LocationRecommendation
              key={location.id}
              location={location}
              index={index}
              isVisible={showLocations}
              onClick={() => onLocationSelect(location)}
              isSelected={selectedLocation?.id === location.id}
            />
          ))}
        </div>
      )}
    </div>
  );
} */