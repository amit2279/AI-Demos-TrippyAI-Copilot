export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface Location {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviews: number;
  city: string;
  imageUrl: string;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* import { NextApiRequest, NextApiResponse } from 'next';
import { Anthropic } from '@anthropic-ai/sdk';
import cors from 'cors';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

console.log('CLAUDE_API_KEY ----- ', process.env.CLAUDE_API_KEY);

// Initialize CORS middleware
const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  origin: ['https://ai-demo-trippy-o5698r11o-amits-projects-04ce3c09.vercel.app', 'http://localhost:5173']
});

// Wrapper for using CORS with API routes
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run the CORS middleware
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      console.log('FILE SRC CHAT - TS: ---------------------------- IN VISION REQUEST');
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
        system: 'You are a computer vision expert. Analyze the image and provide location details in valid JSON format.',
        temperature: 0.2
      });

      const text = response.content[0].text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      console.log('FILE SRC CHAT - TS: ---------------------------- IN CHAT REQUEST')
      const stream = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages,
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
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} */