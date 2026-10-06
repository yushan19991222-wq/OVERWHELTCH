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
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = response.text?.trim() || '';
          if (rawText) {
            const cleaned = rawText.replace(/```json\s*|\s*```/gi, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              memeData = {
                keyword: parsed.keyword || memeData.keyword,
                punchline: parsed.punchline || memeData.punchline,
                advice: parsed.advice || memeData.advice,
                imagePrompt: parsed.imagePrompt || memeData.imagePrompt,
              };
            }
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
   * POST /api/gemini/face-score
   * AI Face Charisma & Beauty Score Evaluator
   */
  app.post('/api/gemini/face-score', async (req, res) => {
    try {
      const {
        smile = 0.5,
        browRelaxation = 0.8,
        eyeOpenness = 0.8,
        proximityPct = 40,
        yawnsCount = 0,
        frownsCount = 0,
        consecutiveDeskMinutes = 0,
        healthScore = 100,
      } = req.body;
      const client = getGeminiClient();

      if (client) {
        try {
          const prompt = `You are a hilarious, high-energy Taiwanese entertainment and AI office vitality index evaluator (戰術顏值與靈魂神彩雷達評測系統).
The user is sitting in front of the webcam. Biometric Telemetry:
- Mouth Curvature / Smile Arc: ${(smile * 100).toFixed(0)}%
- Brow Relaxation: ${(browRelaxation * 100).toFixed(0)}%
- Eye Openness Arc: ${(eyeOpenness * 100).toFixed(0)}%
- Yawns Count: ${yawnsCount}
- Frowns Count: ${frownsCount}
- Desk Sitting Minutes: ${consecutiveDeskMinutes}m
- Health Reserve: ${healthScore}/100

STRICT SCORING RULES (NOT physical appearance, but mental vitality, smile arc & eye alertness):
- Rank scale: SSS (92-100), SS (84-91), S (75-83), A (68-74), B (52-67), C (36-51), D (<36).
- Baseline for a flat, unsmiling expression (Smile Arc < 15%) is 48 - 58 PTS (Rank B: 微帶班味/輕微疲態). 58 points is strictly Rank B.
- If Smile Arc < 10% AND Eye Openness Arc < 60% or Yawns > 0, score MUST drop to 20 - 45 PTS (Rank C or D, lost soul/exhausted).
- ONLY award 75+ PTS (Rank S, SS or SSS) if Smile Arc >= 35% (visible upward mouth arc/smile) AND Eye Openness Arc >= 75%!

Generate a fun evaluation in JSON format with:
1. "score": integer between 15 and 98 according to the strict rules above.
2. "rank": "SSS" | "SS" | "S" | "A" | "B" | "C" | "D".
3. "title": a humorous Taiwanese title (max 20 characters).
4. "comment": a witty 1-2 sentence remark about their current expression/vitality (max 45 characters, in Traditional Chinese).
5. "highlightTag": short tag.
6. "metrics": object with integer percentage values (0-100) reflecting:
   - "radiance": 面色氣色紅潤 (vitality & facial energy, based on health reserve)
   - "sparkle": 眼神聚焦清澈 (eye alertness & clear gaze, lower if drowsy/yawning)
   - "smilePower": 嘴角自然舒展 (smile arc & positive facial aura)
   - "symmetry": 眉心舒展放鬆 (brow relaxation, lower if frowning/stressed)
   - "charisma": 神態清爽無倦 (anti-fatigue resilience, lower if sitting prolonged time)

Respond ONLY in valid JSON.`;

          const response = await client.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = response.text?.trim() || '';
          if (rawText) {
            const cleaned = rawText.replace(/```json\s*|\s*```/gi, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return res.json({
                success: true,
                score: parsed.score || 88,
                rank: parsed.rank || 'S',
                title: parsed.title || '高智感元氣職場高光 ✨',
                comment: parsed.comment || '狀態平穩，眼神有光，繼續保持優雅辦公！',
                highlightTag: parsed.highlightTag || 'STABLE_WORKER',
                metrics: parsed.metrics || {
                  radiance: 85,
                  sparkle: 88,
                  smilePower: 80,
                  symmetry: 85,
                  charisma: 82,
                },
              });
            }
          }
        } catch (geminiErr) {
          console.warn('Gemini face-score call failed, using local fallback:', geminiErr);
        }
      }

      // Local Fallback
      res.json({
        success: false,
        message: 'Falling back to local neural score computation',
      });
    } catch (err: any) {
      console.warn('face-score API error:', err);
      res.json({
        success: false,
        message: 'API error fallback',
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
        model: 'imagen-3.0-generate-002',
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

  // Serve public static assets (including /memes/*)
  app.use(express.static(path.join(process.cwd(), 'public')));

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
