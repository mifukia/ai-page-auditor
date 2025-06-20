import { OpenAI } from 'openai';

// Vercelは.envを自動で読み込む
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

export default async function handler(req, res) {
  // CORSヘッダーを常に付与
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエスト（OPTIONS）対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ result: 'Method Not Allowed' });
  }
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ result: 'promptが必要です' });
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });
    res.status(200).json({ result: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ result: 'OpenAI APIエラー: ' + err.message });
  }
} 