import axios from 'axios';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const AI_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

export async function chatCompletion(options: ChatCompletionOptions): Promise<string> {
  const apiKey = env.openrouter.apiKey;
  if (!apiKey) {
    throw new AppError(
      503,
      'OpenRouter API key not configured. Set OPENROUTER_API_KEY in environment.',
      'OPENROUTER_NOT_CONFIGURED'
    );
  }

  const model = options.model ?? env.openrouter.defaultModel;

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': env.openrouter.siteUrl,
          'X-Title': env.openrouter.appName,
          'Content-Type': 'application/json',
        },
        timeout: env.chatTimeout,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError(502, 'Empty response from OpenRouter', 'OPENROUTER_EMPTY');
    }
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.error?.message ?? err.message;
      throw new AppError(err.response?.status ?? 502, `OpenRouter error: ${msg}`, 'OPENROUTER_ERROR');
    }
    throw err;
  }
}

/** Fallback when no API key — rule-based assistant reply */
export function mockChatReply(userMessage: string, context?: string): string {
  const preview = userMessage.slice(0, 120);
  return (
    `[Modo demonstração — configure OPENROUTER_API_KEY para respostas reais]\n\n` +
    `Recebi sua mensagem: "${preview}${userMessage.length > 120 ? '...' : ''}".\n\n` +
    (context
      ? `Contexto de frameworks consultivos foi carregado (${context.length} caracteres).\n\n`
      : '') +
    `Como consultor Magnus Mind, recomendo revisar seus objetivos estratégicos e alinhar a equipe nas prioridades do trimestre.`
  );
}
