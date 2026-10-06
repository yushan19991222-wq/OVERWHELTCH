import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Curated high-relevance fallback office stress / frown GIFs
const FALLBACK_FROWN_GIFS = [
  {
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    title: 'Grumpy Cat Furious',
    keyword: 'grumpy cat office',
  },
  {
    url: 'https://media.giphy.com/media/QMHoU66sBXCAUeBZ34/giphy.gif',
    title: 'This is Fine Dog Fire',
    keyword: 'this is fine stress',
  },
  {
    url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    title: 'Screaming Goat Panic',
    keyword: 'screaming goat work',
  },
  {
    url: 'https://media.giphy.com/media/xUPGcl3ijl0vR97KcE/giphy.gif',
    title: 'Sloth typing slowly',
    keyword: 'sloth office typing',
  },
  {
    url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    title: 'Crying dramatic dog',
    keyword: 'crying drama stress',
  },
  {
    url: 'https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif',
    title: 'Facepalm monkey',
    keyword: 'facepalm work stress',
  },
];

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  /**
   * POST /api/gemini/frown-meme
   * Generates a witty stress meme punchline, a targeted Giphy search keyword,
   * and fetches dynamic animated GIF results from GIPHY.
   */
  app.post('/api/gemini/frown-meme', async (req, res) => {
    try {
      const { stressLevel = 'high', customNote = '' } = req.body;
      const client = getGeminiClient();

      let memeData = {
        keyword: 'stressed cat office',
        punchline: '薪水三萬二，眉頭深鎖像背了三千萬房貸！',
        advice: '深呼吸三口，放鬆額頭，這點薪水不值得長出抬頭紋。',
        imagePrompt: 'A funny sarcastic grumpy cat in business attire looking frustrated at a spreadsheet',
      };

      if (client) {
        try {
          const prompt = `You are a hilarious, witty Taiwanese office wellness bot. The user is in an office looking at their screen with a heavy frown, tight forehead muscles, and high work stress level (${stressLevel}). ${customNote}
Return a JSON object with:
1. "keyword": a 2-4 word English search term for finding hilarious animated GIFs on GIPHY related to funny work stress / dramatic reactions / grumpy animals / facepalms (e.g. "screaming goat work", "this is fine dog", "grumpy cat desk", "dramatic stress facepalm", "sloth typing rage").
2. "punchline": a hilarious, highly relatable Taiwanese Chinese office meme one-liner (max 28 characters, humorous and sarcastic about office life, salaries, and unnecessary wrinkles).
3. "advice": a short 1-sentence comforting/funny relaxation reminder (max 35 characters).
4. "imagePrompt": a vivid English prompt describing a funny cartoon/meme image representing this stress.
Respond ONLY in valid JSON format.`;

          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = response.text?.trim() || '';
          if (rawText) {
            const parsed = JSON.parse(rawText);
            memeData = {
              keyword: parsed.keyword || memeData.keyword,
              punchline: parsed.punchline || memeData.punchline,
              advice: parsed.advice || memeData.advice,
              imagePrompt: parsed.imagePrompt || memeData.imagePrompt,
            };
          }
        } catch (geminiErr) {
          console.warn('Gemini content generation failed, using fallback:', geminiErr);
        }
      }

      // Query GIPHY API using the Gemini-generated keyword
      let gifUrl = '';
      let gifTitle = '';
      try {
        const giphyApiKey = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Public test key fallback
        const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(
          memeData.keyword
        )}&limit=10&rating=g`;

        const giphyRes = await fetch(giphyUrl);
        if (giphyRes.ok) {
          const giphyJson = await giphyRes.json();
          if (giphyJson.data && giphyJson.data.length > 0) {
            const randomIndex = Math.floor(Math.random() * giphyJson.data.length);
            const item = giphyJson.data[randomIndex];
            gifUrl =
              item.images?.original?.url ||
              item.images?.downsized_medium?.url ||
              item.images?.fixed_height?.url ||
              '';
            gifTitle = item.title || memeData.keyword;
          }
        }
      } catch (giphyErr) {
        console.warn('Giphy API search error:', giphyErr);
      }

      // If Giphy failed or returned empty, select from curated GIFs
      if (!gifUrl) {
        const fallback =
          FALLBACK_FROWN_GIFS[Math.floor(Math.random() * FALLBACK_FROWN_GIFS.length)];
        gifUrl = fallback.url;
        gifTitle = fallback.title;
      }

      res.json({
        success: true,
        keyword: memeData.keyword,
        punchline: memeData.punchline,
        advice: memeData.advice,
        imagePrompt: memeData.imagePrompt,
        gifUrl,
        gifTitle,
        source: client ? 'gemini+giphy' : 'curated+giphy',
      });
    } catch (err: any) {
      console.error('frown-meme error:', err);
      const fallback = FALLBACK_FROWN_GIFS[0];
      res.json({
        success: true,
        keyword: 'office stress',
        punchline: '皺眉一秒鐘，顯老一整年；薪水照常發，何苦虐眉尖！',
        advice: '深呼吸三次，讓額頭放鬆，喝口水再繼續奮戰！',
        imagePrompt: 'Grumpy cat relaxing in office chair',
        gifUrl: fallback.url,
        gifTitle: fallback.title,
        source: 'fallback',
      });
    }
  });

  /**
   * POST /api/gemini/generate-image
   * Generate an AI meme image using Gemini if requested
   */
  app.post('/api/gemini/generate-image', async (req, res) => {
    try {
      const { prompt = 'Funny cute cat stressed at computer desk meme' } = req.body;
      const client = getGeminiClient();

      if (!client) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `Generate a humorous, bright comic meme illustration: ${prompt}. Clean background, vibrant colors, expressive funny animal face.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        return res.status(500).json({ error: 'Image was not generated in response parts' });
      }

      res.json({ success: true, imageUrl, prompt });
    } catch (err: any) {
      console.warn('generate-image error:', err.message);
      res.status(500).json({ error: err.message || 'Image generation failed' });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
