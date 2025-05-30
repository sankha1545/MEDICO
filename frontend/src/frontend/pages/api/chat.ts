// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' }) // Avoid exposing source or default fallback
  }

  try {
    const { messages } = req.body as {
      messages: Array<{ role: string; content: string }>
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourwebsite.com',
        'X-Title': 'My Chatbot',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-prover-v2:free',
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error response:', errorText)
      return res.status(response.status).json({ error: errorText })
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content ?? ''
    res.status(200).json({ answer })
  } catch (error: any) {
    console.error('Chat API error:', error)
    res.status(500).json({ error: 'Failed to fetch from OpenRouter' })
  }
}
