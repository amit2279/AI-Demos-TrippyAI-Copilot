import type { Request, Response } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import type { CorsOptions, CorsRequest } from 'cors';
import cors from 'cors';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
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

/* const CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant. For ALL location-related queries, follow these rules:

1. For EXPLICIT recommendation requests (e.g., "show me places in X", "what to visit in X"):
   - Provide a detailed response with bullet points
   - Include the full JSON locations block with multiple places

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

3. For WEATHER queries:
   - ONLY respond with "Let me check the current weather in [City]..."
   - Extract ONLY the city name
   - NO additional information

CRITICAL: NEVER skip the locations JSON for any location-related query, as it's needed for map navigation!`;
 */

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


// Initialize CORS middleware
const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',
    'https://ai-demo-trippy.vercel.app',
    /https:\/\/ai-demo-trippy-.*-amits-projects-04ce3c09\.vercel\.app/
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Wrapper for using CORS with API routes
function runMiddleware(
  req: Request,
  res: Response,
  fn: (req: CorsRequest, res: Response, callback: (err: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req as CorsRequest, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

export default async function handler(
  req: Request,
  res: Response
) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors(corsOptions));

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request format' });
      return;
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
      console.log('FILE CHAT - TS: ---------------------------- IN VISION REQUEST');
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        system: VISION_SYSTEM_PROMPT,
        temperature: 0.2
      });

      const text = response.content[0].text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      console.log('FILE CHAT - TS: ---------------------------- IN MESSAGE REQUEST');
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
    console.error('API error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (e) {
        console.error('Error sending error response:', e);
      }
    }
  }
}