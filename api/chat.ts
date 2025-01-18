// api/chat.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';

// Validate required environment variables
if (!process.env.CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Request headers:', req.headers);
  console.log('Request body:', typeof req.body === 'string' ? 'string payload' : 'parsed payload');

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format: messages array required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('Creating Claude stream...');
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages,
      stream: true,
      temperature: 0.7
    });

    console.log('Stream created, sending response...');

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API Error:', error);

    // If headers haven't been sent yet
    if (!res.headersSent) {
      // Handle specific error types
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

        // Log detailed error information
        console.error('Error details:', {
          message: errorMessage,
          stack: error.stack,
          name: error.name
        });

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
}

/* import { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isVisionRequest = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image')
    );

    if (isVisionRequest) {
      console.log('Processing vision request');
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: messages,
          system: 'You are a computer vision expert. Analyze the image and provide location details in valid JSON format.',
          temperature: 0.2
        });

        const text = response.content[0].text;
        try {
          // Try to parse as JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            res.write(`data: ${JSON.stringify({ text: JSON.stringify(json) })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ 
              text: JSON.stringify({ error: "Could not identify location" })
            })}\n\n`);
          }
        } catch (e) {
          console.error('JSON parsing error:', e);
          res.write(`data: ${JSON.stringify({ 
            text: JSON.stringify({ error: "Failed to parse location data" })
          })}\n\n`);
        }
      } catch (error) {
        console.error('Vision API error:', error);
        res.write(`data: ${JSON.stringify({ 
          text: JSON.stringify({ 
            error: "Failed to process image",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          })
        })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Regular chat processing
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

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} */