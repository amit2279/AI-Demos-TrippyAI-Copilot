/* import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

// System prompts remain the same
const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

CRITICAL - WEATHER QUERY HANDLING:
For ANY query containing words like "weather", "temperature", "climate", "forecast", or asking about seasons:
- You MUST ONLY respond with EXACTLY: "Let me check the current weather in [City]..."
- Extract ONLY the city name from the query
- DO NOT provide ANY weather information, forecasts, or seasonal details
- DO NOT include ANY JSON data for weather queries
- DO NOT mention historical weather patterns
- DO NOT suggest best times to visit
- DO NOT include any additional information

For all other location queries, format your response in two parts:

1. Your natural language response, which should:
   - Use bullet points or numbered lists for better readability
   - Keep each location description to 1-2 lines maximum
   - Focus on the unique key features of each place
   - DO NOT include ANY weather or climate information

2. Followed by a JSON block in this EXACT format:

{ "locations": [
  {
    "name": "Location Name",
    "coordinates": [latitude, longitude],
    "rating": 4.5,
    "reviews": 1000,
    "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
  }
] }`;

const VISION_SYSTEM_PROMPT = `You are a computer vision expert specializing in identifying landmarks and locations from images. When shown an image:

1. Identify the main landmark, building, or location
2. Determine the city and country where it's located
3. Determine its exact geographical coordinates
4. Provide a brief 1-2 line description
5. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "city": "City Name",
  "country": "Country",
  "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W",
  "description": "Brief description"
}

CRITICAL RULES:
- ALWAYS include the city name separately from the location name
- City name should be the main city, not a district or neighborhood
- For monuments/landmarks, use the city they are located in
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;

// CORS configuration with proper typing
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy.vercel.app',
      /\.vercel\.app$/ // Allows all vercel.app subdomains
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') 
        ? origin.startsWith(allowed.replace('*', '')) 
        : origin === allowed
    )) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      const error = new Error('Not allowed by CORS');
      callback(error);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

// Error handling middleware with proper typing
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server] Error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message });
  }
};

// Increase payload limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
 */

/* import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});
 */

import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

/* // System prompts remain the same
const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

CRITICAL - WEATHER QUERY HANDLING:
For ANY query containing words like "weather", "temperature", "climate", "forecast", or asking about seasons:
- You MUST ONLY respond with EXACTLY: "Let me check the current weather in [City]..."
- Extract ONLY the city name from the query
- DO NOT provide ANY weather information, forecasts, or seasonal details
- DO NOT include ANY JSON data for weather queries
- DO NOT mention historical weather patterns
- DO NOT suggest best times to visit
- DO NOT include any additional information

For all other location queries, format your response in two parts:

1. Your natural language response, which should:
   - Use bullet points or numbered lists for better readability
   - Keep each location description to 1-2 lines maximum
   - Focus on the unique key features of each place
   - DO NOT include ANY weather or climate information

2. Followed by a JSON block in this EXACT format:

{ "locations": [
  {
    "name": "Location Name",
    "coordinates": [latitude, longitude],
    "rating": 4.5,
    "reviews": 1000,
    "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
  }
] }`; */

/* const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL location-related queries, follow these rules:

1. For Explicit Location Recommendations (Only when user asks specifically):
   - Trigger on phrases like:
     • "Show me places to visit in..."
     • "What are the best attractions in..."
     • "What should I see in..."
     • "Where can I go in..."
     • "Recommend places in..."

   When providing recommendations:
   a) First give a brief introduction
   b) Then list 3-5 top places with one-line descriptions
   c) Include JSON block in this EXACT format:
   { "locations": [
     {
       "name": "Location Name",
       "city": "City Name",  // CRITICAL: Always include city name
       "coordinates": [latitude, longitude],
       "rating": 4.5,
       "reviews": 1000,
       "image": "https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop",
       "description": "Brief description"
     }
   ] }

2. For GENERAL location queries (e.g., "tell me about X", "what is X like"):
   - Provide a brief 2-3 line summary about the place
   - Ask if they would like to know more
   - ALWAYS include a single location JSON for the main city/place:
   
   { "locations": [{
     "name": "City Name, Country",
     "coordinates": [latitude, longitude],
     "rating": 4.5,
     "reviews": 1000,
     "description": "Brief description"
   }]}

3. For Weather Queries:
   - If query contains "weather", "temperature", "climate", "forecast":
   - ONLY respond with: "Let me check the current weather in [City]..."
   - Extract ONLY the city name from the query
   - DO NOT provide any weather information or forecasts
   - DO NOT include ANY JSON data

4. Response Format:
   - Use natural, conversational tone
   - Keep descriptions concise
   - Avoid technical jargon
   - Be friendly but professional

Remember: 
- For general inquiries: Brief 2-3 sentence overview ONLY
- Only generate location cards when explicitly asked for recommendations
- ALWAYS include city name in location data for proper context updates
- CRITICAL: NEVER skip the locations JSON for any location-related query, as it's needed for map navigation!`;
 */
/* 
const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL location-related queries, follow these rules:

1. For Explicit Location Recommendations (Only when user asks specifically):
   - Trigger on phrases like:
     • "Show me places to visit in..."
     • "What are the best attractions in..."
     • "What should I see in..."
     • "Where can I go in..."
     • "Recommend places in..."

   When providing recommendations:
   a) First give a brief introduction
   b) Then list 3-5 top places with one-line descriptions
   c) Include JSON block in this EXACT format:
   { "locations": [
     {
       "name": "Location Name",
       "city": "City Name",  // CRITICAL: Always include city name
       "coordinates": [latitude, longitude],
       "rating": 4.5,
       "reviews": 1000,
       "image": "https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop",
       "description": "Brief description"
     }
   ] }

2. For GENERAL location queries (e.g., "tell me about X", "what is X like"):
   - Provide a brief 2-3 line summary about the place
   - Ask if they would like to know more
   - ALWAYS include a single location JSON for the main city/place:
   
   { "locations": [{
     "name": "City Name, Country",
     "coordinates": [latitude, longitude],
     "rating": 4.5,
     "reviews": 1000,
     "description": "Brief description"
   }]}

3. For Weather Queries:
   - If query contains "weather", "temperature", "climate", "forecast":
   - ONLY respond with: "Let me check the current weather in [City]..."
   - Extract ONLY the city name from the query
   - DO NOT provide any weather information or forecasts
   - DO NOT include ANY JSON data

4. Response Format:
   - Use natural, conversational tone
   - Keep descriptions concise
   - Avoid technical jargon
   - Be friendly but professional

Remember: 
- For general inquiries: Brief 2-3 sentence overview ONLY
- Only generate location cards when explicitly asked for recommendations
- ALWAYS include city name in location data for proper context updates
- CRITICAL: NEVER skip the locations JSON for any location-related query, as it's needed for map navigation!`;
  */

/* const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL location-related queries, follow these rules:

1. For EXPLICIT recommendation requests (e.g., "show me places in X", "what to visit in X"):
   - Provide a detailed response with bullet points
   - Include the full JSON locations block with multiple places
   - Include JSON block in this EXACT format:
   { "locations": [
     {
       "name": "Location Name",
       "city": "City Name",  // CRITICAL: Always include city name
       "coordinates": [latitude, longitude],
       "rating": 4.5,
       "reviews": 1000,
       "image": "https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop",
       "description": "Brief description"
     }
   ] }

2. For GENERAL location queries (e.g., "tell me about X", "what is X like"):
   - Provide a brief 2-3 line summary about the place
   - Ask if they would like to know more
   - ALWAYS include a single location JSON for the main city/place:
   
   {"name": "City Name, Country","coordinates": [latitude, longitude],description: 'ancient temples and traditional gardens'}

3. For WEATHER queries:
   - ONLY respond with "Let me check the current weather in [City]..."
   - Extract ONLY the city name
   - NO additional information

CRITICAL: NEVER skip the locations JSON for any location-related query, as it's needed for map navigation!`;
 */

const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL location-related queries, follow these rules:

1. For Explicit Location Recommendations (Only when user asks specifically):
   - Trigger on phrases like:
     • "Show me places to visit in..."
     • "What are the best attractions in..."
     • "What should I see in..."
     • "Where can I go in..."
     • "Recommend places in..."

   When providing recommendations:
   a) Provide a descripton of the place with bullet points
   b) Then list 3-5 top places with one-line descriptions
   c) Include JSON block in this EXACT format:
   { "locations": [
     {
       "name": "Location Name",
       "city": "City Name",  // CRITICAL: Always include city name
       "coordinates": [latitude, longitude],
       "rating": 4.5,
       "reviews": 1000,
       "image": "https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop"
     }
   ] }

2. For GENERAL location queries (e.g., "tell me about X", "what is X like"):
   - Provide a brief 2-3 line summary about the place
   - Ask if they would like to know more
   - ALWAYS include a single location JSON for the main city/place:
   
   {"name": "City Name, Country","coordinates": [latitude, longitude],description: 'ancient temples and traditional gardens'}

3. For Weather Queries:
   - If query contains "weather", "temperature", "climate", "forecast":
   - ONLY respond with: "Let me check the current weather in [City]..."
   - Extract ONLY the city name from the query
   - ALWAYS be concise in your responses, focusing on key information without unnecessary long text or verbosity
   - DO NOT provide any weather information or forecasts
   - DO NOT include ANY JSON data

4. Response Format:
   - Use natural, conversational tone
   - Keep descriptions concise
   - Avoid technical jargon
   - Be friendly but professional

Remember: 
- For general inquiries: Brief 2-3 sentence overview ONLY
- Only generate location cards when explicitly asked for recommendations
- ALWAYS include city name in location data for proper context updates
- CRITICAL: NEVER skip the locations JSON for any location-related query, as it's needed for map navigation!`;
 

const VISION_SYSTEM_PROMPT = `You are a computer vision expert specializing in identifying landmarks and locations from images. When shown an image:

1. Identify the main landmark, building, or location
2. Determine the city and country where it's located
3. Determine its exact geographical coordinates
4. Provide a brief 1-2 line description
5. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "city": "City Name",
  "country": "Country",
  "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W",
  "description": "Brief description"
}

CRITICAL RULES:
- ALWAYS include the city name separately from the location name
- City name should be the main city, not a district or neighborhood
- For monuments/landmarks, use the city they are located in
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;


// Increase payload limits and add proper parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Chat endpoint with improved error handling
app.post('/api/chat', async (req, res) => {
  try {
    console.log('[Server] Processing chat request');
    console.log('[Server] Request body:', JSON.stringify(req.body).substring(0, 200));
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Filter out invalid messages
    const validMessages = messages.filter(msg => {
      if (Array.isArray(msg.content)) {
        return msg.content.length > 0 && msg.content.every(c => 
          (c.type === 'text' && c.text?.trim()) || 
          (c.type === 'image' && c.source?.data)
        );
      }
      return msg.content?.trim();
    });

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'No valid messages provided' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      try {
        console.log('[Server] Processing vision request ----------------------------------------');
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: validMessages,
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2
        });

        const text = response.content[0].text;
        console.log('[Server] Vision response:', text.substring(0, 200));
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      } catch (error) {
        console.error('[Server] Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Failed to process image" })
        })}\n\n`);
      }
    } else {
      console.log('[Server] Processing chat request -------------------------------------- ',CHAT_SYSTEM_PROMPT);
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: validMessages,
        system: CHAT_SYSTEM_PROMPT,
        temperature: 0.2,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Server] Error:', error);
    
    // If headers haven't been sent yet
    if (!res.headersSent) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          return res.status(401).json({ 
            error: 'Authentication failed', 
            details: 'Invalid API key'
          });
        }
        
        if (errorMessage.includes('429')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            details: 'Please try again later'
          });
        }
        
        if (errorMessage.includes('413')) {
          return res.status(413).json({ 
            error: 'Payload too large',
            details: 'Request content exceeds size limit'
          });
        }

        return res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred'
        });
      }

      return res.status(500).json({
        error: 'Unknown error occurred'
      });
    }

    // If headers were already sent, try to send error in stream format
    try {
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('Error while sending error response:', e);
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
  console.log('[Server] Environment:', process.env.NODE_ENV);
  console.log('[Server] API key configured:', !!anthropic.apiKey);
});

/* // Increase payload limits and add proper parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Chat endpoint with improved error handling
app.post('/api/chat', async (req, res) => {
  try {
    console.log('[Server] Processing chat request');
    console.log('[Server] Request body:', JSON.stringify(req.body).substring(0, 200));
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Filter out invalid messages
    const validMessages = messages.filter(msg => {
      if (Array.isArray(msg.content)) {
        return msg.content.length > 0 && msg.content.every(c => 
          (c.type === 'text' && c.text?.trim()) || 
          (c.type === 'image' && c.source?.data)
        );
      }
      return msg.content?.trim();
    });

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'No valid messages provided' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      try {
        console.log('[Server] Processing vision request');
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: validMessages,
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2
        });

        const text = response.content[0].text;
        console.log('[Server] Vision response:', text.substring(0, 200));
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      } catch (error) {
        console.error('[Server] Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Failed to process image" })
        })}\n\n`);
      }
    } else {
      console.log('[Server] Processing chat request');
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: validMessages,
        system: CHAT_SYSTEM_PROMPT,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Server] Error:', error);
    
    // If headers haven't been sent yet
    if (!res.headersSent) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          return res.status(401).json({ 
            error: 'Authentication failed', 
            details: 'Invalid API key'
          });
        }
        
        if (errorMessage.includes('429')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            details: 'Please try again later'
          });
        }
        
        if (errorMessage.includes('413')) {
          return res.status(413).json({ 
            error: 'Payload too large',
            details: 'Request content exceeds size limit'
          });
        }

        return res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred'
        });
      }

      return res.status(500).json({
        error: 'Unknown error occurred'
      });
    }

    // If headers were already sent, try to send error in stream format
    try {
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('Error while sending error response:', e);
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
  console.log('[Server] Environment:', process.env.NODE_ENV);
  console.log('[Server] API key configured:', !!anthropic.apiKey);
});
 */





/* 
import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from './src/config';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Validate API key immediately
if (!CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY || process.env.CLAUDE_API_KEY
});

// System prompts remain the same
const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. Provide helpful travel recommendations and information.

CRITICAL - WEATHER QUERY HANDLING:
For ANY query containing words like "weather", "temperature", "climate", "forecast", or asking about seasons:
- You MUST ONLY respond with EXACTLY: "Let me check the current weather in [City]..."
- Extract ONLY the city name from the query
- DO NOT provide ANY weather information, forecasts, or seasonal details
- DO NOT include ANY JSON data for weather queries
- DO NOT mention historical weather patterns
- DO NOT suggest best times to visit
- DO NOT include any additional information

For all other location queries, format your response in two parts:

1. Your natural language response, which should:
   - Use bullet points or numbered lists for better readability
   - Keep each location description to 1-2 lines maximum
   - Focus on the unique key features of each place
   - DO NOT include ANY weather or climate information

2. Followed by a JSON block in this EXACT format:

{ "locations": [
  {
    "name": "Location Name",
    "coordinates": [latitude, longitude],
    "rating": 4.5,
    "reviews": 1000,
    "image": "https://images.unsplash.com/photo-SPECIFIC-PHOTO-ID?w=800&h=600&fit=crop"
  }
] }`;

const VISION_SYSTEM_PROMPT = `You are a computer vision expert specializing in identifying landmarks and locations from images. When shown an image:

1. Identify the main landmark, building, or location
2. Determine the city and country where it's located
3. Determine its exact geographical coordinates
4. Provide a brief 1-2 line description
5. Format your response EXACTLY like this, with no additional text:

{
  "name": "Exact Location Name",
  "city": "City Name",
  "country": "Country",
  "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W",
  "description": "Brief description"
}

CRITICAL RULES:
- ALWAYS include the city name separately from the location name
- City name should be the main city, not a district or neighborhood
- For monuments/landmarks, use the city they are located in
- ONLY respond with the JSON format above
- Coordinates MUST be valid numbers
- If location cannot be identified with high confidence, respond with: {"error": "Location could not be identified"}
- DO NOT include any explanatory text outside the JSON
- DO NOT include weather or seasonal information
- Keep descriptions factual and brief`;

// Increase payload limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages,
          system: VISION_SYSTEM_PROMPT,
          temperature: 0.2
        });

        const text = response.content[0].text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      } catch (error) {
        console.error('[Server] Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ error: "Failed to process image" })
        })}\n\n`);
      }
    } else {
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        system: CHAT_SYSTEM_PROMPT,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Server] Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
}); */