import { config } from '../config';

/**
 * Text-generation boundary for the design assistant.
 *
 * The rest of the application never calls a provider SDK directly. This keeps
 * prompt/schema handling testable and makes a future provider swap additive.
 * Image generation is deliberately a separate capability; see the catalog image
 * resolver in `services/eventDesign.ts`.
 */

export interface AIJsonRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateJson(request: AIJsonRequest): Promise<unknown>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'AI_PROVIDER_ERROR',
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * OpenAI-compatible chat-completions adapter.
 *
 * This is the documented HTTP shape used by OpenAI and compatible providers; no
 * provider-specific SDK is required. The API key is only ever placed in the
 * server-side Authorization header and is never returned or logged.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';

  isConfigured(): boolean {
    return Boolean(config.ai.apiKey && config.ai.baseUrl && config.ai.model);
  }

  async generateJson(request: AIJsonRequest): Promise<unknown> {
    if (!this.isConfigured()) {
      throw new AIProviderError('AI text generation is not configured', 'AI_NOT_CONFIGURED');
    }

    const timeoutMs = Math.min(
      Math.max(request.timeoutMs ?? config.ai.timeoutMs, 1000),
      60_000,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${config.ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.apiKey}`,
        },
        body: JSON.stringify({
          model: config.ai.model,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
          temperature: request.temperature ?? 0.6,
          max_tokens: Math.min(
            request.maxTokens ?? config.ai.maxOutputTokens,
            8000,
          ),
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Never include the response body: a provider error can echo request
        // fragments, and logs should stay free of user content.
        throw new AIProviderError(`AI provider returned HTTP ${response.status}`);
      }

      const text = await response.text();
      if (text.length > 200_000) {
        throw new AIProviderError('AI provider response was too large');
      }

      const data = JSON.parse(text) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new AIProviderError('AI provider returned an empty response');
      }

      try {
        return JSON.parse(stripCodeFence(content)) as unknown;
      } catch {
        throw new AIProviderError('AI provider returned invalid JSON');
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIProviderError('AI provider request timed out', 'AI_TIMEOUT');
      }
      throw new AIProviderError('AI provider request failed');
    } finally {
      clearTimeout(timer);
    }
  }
}

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) provider = new OpenAICompatibleProvider();
  return provider;
}
