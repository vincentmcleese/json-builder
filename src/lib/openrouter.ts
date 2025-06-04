import { z } from 'zod'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

export const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string()
      })
    })
  )
})

export async function callOpenRouter(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  trainingData: { name: string; content: string }[] = []
) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured. Please check your environment variables.')
    }

    let fullPrompt = systemPrompt;

    if (trainingData.length > 0) {
      fullPrompt += '\n\n# Training Examples\n\n';
      trainingData.forEach(data => {
        fullPrompt += `## ${data.name}\n\n${data.content}\n\n`;
      });
    }

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'JSON Creator'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const statusMessage = response.statusText || 'No status message provided';
      throw new Error(
        `OpenRouter API error: Status ${response.status} - ${statusMessage}\n` +
        `Response: ${errorBody || 'No response body'}`
      );
    }

    const data = await response.json()
    const parsed = OpenRouterResponseSchema.parse(data)
    return parsed.choices[0].message.content
  } catch (error) {
    if (error instanceof Error) {
      console.error('OpenRouter API error:', error.message)
      throw new Error(`OpenRouter API error: ${error.message}`)
    } else {
      console.error('OpenRouter API error:', error)
      throw new Error('An unexpected error occurred while calling OpenRouter API')
    }
  }
}