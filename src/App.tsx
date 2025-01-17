import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MapPanel } from './components/MapPanel';
import { MapToggle } from './components/MapToggle';
import { Message, Location } from './types/chat';
import { getStreamingChatResponse } from './services/claude';
import { extractLocationsFromResponse } from './services/locationParser';
import { getRandomCity, generateWelcomeMessage, getCityAsLocation } from './services/cityService';
import { validateQuery } from './services/chat/queryValidator';
import { cityContext } from './services/cityContext';
import { processStreamingMessage } from './services/chat/messageProcessor';

export default function App() {
  const initialCity = getRandomCity();
  const initialLocation = getCityAsLocation(initialCity);
  
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: generateWelcomeMessage(initialCity),
    sender: 'bot',
    timestamp: new Date()
  }]);

  const [locations, setLocations] = useState<Location[]>([initialLocation]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const [mapView, setMapView] = useState<'osm' | 'google'>('osm');
  const [error, setError] = useState<string | null>(null);
  const [currentWeatherLocation, setCurrentWeatherLocation] = useState<string | null>(null);

  useEffect(() => {
    cityContext.setCurrentCity(initialCity.name);
  }, []);

  // Function to get city name from coordinates using reverse geocoding
  const getCityFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      console.log('[App] Reverse geocoding result:', data);
      
      // Extract city name from address components
      const city = data.address?.city || 
                  data.address?.town || 
                  data.address?.village || 
                  data.address?.municipality ||
                  data.address?.county ||
                  data.display_name.split(',')[0];
                  
      console.log('[App] Extracted city name:', city);
      return city;
    } catch (error) {
      console.error('[App] Error getting city name from coordinates:', error);
      return '';
    }
  };

  useEffect(() => {
    if (currentStreamingMessage?.content) {
      const { jsonContent, weatherLocation } = processStreamingMessage(currentStreamingMessage.content);
      
      if (weatherLocation) {
        console.log('[App] Weather location detected:', weatherLocation);
        setCurrentWeatherLocation(weatherLocation);
        return;
      }

      if (jsonContent) {
        const newLocations = extractLocationsFromResponse(jsonContent);
        console.log('[App] Extracted locations:', {
          count: newLocations.length,
          locations: newLocations.map(loc => ({
            name: loc.name,
            coordinates: [loc.position.lat, loc.position.lng]
          }))
        });
        
        if (newLocations.length > 0) {
          setLocations(newLocations);
          // Get city name from coordinates of first location
          getCityFromCoordinates(
            newLocations[0].position.lat, 
            newLocations[0].position.lng
          ).then(cityName => {
            if (cityName) {
              console.log('[App] Setting city context from coordinates:', cityName);
              cityContext.setCurrentCity(cityName);
              setCurrentWeatherLocation(cityName);
            }
          });
        }
      }
    }
  }, [currentStreamingMessage?.content]);

  const handleLocationSelect = useCallback(async (location: Location) => {
    console.log('[App] Location selected:', location.name);
    setSelectedLocation(location);
    
    // Get city name from coordinates when location is selected
    const cityName = await getCityFromCoordinates(location.position.lat, location.position.lng);
    if (cityName) {
      console.log('[App] Setting city context from selected location:', cityName);
      cityContext.setCurrentCity(cityName);
      setCurrentWeatherLocation(cityName);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('[App] Handling new message:', content);
    setError(null);
    
    const validation = validateQuery(content);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setSelectedLocation(null);

    // Handle weather queries
    if (validation.type === 'weather') {
      const weatherLocation = validation.location || cityContext.getCurrentCity();
      console.log('[App] Weather query for location:', weatherLocation);
      setCurrentWeatherLocation(weatherLocation);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Let me check the current weather in ${weatherLocation}...`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setCurrentStreamingMessage(botMessage);

    try {
      const claudeMessages = messages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));
      claudeMessages.push({ role: 'user', content });

      let fullResponse = '';
      const stream = getStreamingChatResponse(claudeMessages);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        setCurrentStreamingMessage(prev => prev ? {
          ...prev,
          content: fullResponse
        } : null);
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessage.id 
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('[App] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, content: `I'm sorry, I encountered an error: ${errorMessage}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamingMessage(null);
    }
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[400px] flex-shrink-0 bg-white z-50 relative shadow-lg">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
          streamingMessage={currentStreamingMessage}
          selectedLocation={selectedLocation}
          error={error}
          weatherLocation={currentWeatherLocation}
        />
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-50">
          <MapToggle view={mapView} onToggle={setMapView} />
        </div>
        <MapPanel
          view={mapView}
          locations={locations}
          onLocationSelect={handleLocationSelect}
          isLoading={isLoading}
          isStreaming={isStreaming}
          selectedLocation={selectedLocation}
        />
      </div>
    </div>
  );
}