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
  const apiKey = env.openrouter.apiKey?.trim();
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
      const body = err.response?.data as { error?: { message?: string } } | undefined;
      const bodyMsg =
        typeof body?.error?.message === 'string'
          ? body.error.message
          : typeof err.response?.data === 'object' &&
              err.response?.data !== null &&
              'message' in err.response.data
            ? String((err.response.data as { message?: string }).message)
            : '';
      const msg = bodyMsg || err.message;
      const lower = msg.toLowerCase();
      if (
        err.response?.status === 401 ||
        lower.includes('missing authentication') ||
        lower.includes('invalid api key') ||
        lower.includes('no auth') ||
        lower.includes('incorrect api key')
      ) {
        throw new AppError(
          503,
          'OpenRouter: chave ausente ou rejeitada. No Render, defina OPENROUTER_API_KEY no Web Service da API (variáveis de ambiente do backend — não no Netlify).',
          'OPENROUTER_NOT_CONFIGURED'
        );
      }
      throw new AppError(err.response?.status ?? 502, `OpenRouter error: ${msg}`, 'OPENROUTER_ERROR');
    }
    throw err;
  }
}

/** Fallback when no API key — rule-based assistant reply (varia com o tema da pergunta). */
export function mockChatReply(userMessage: string, context?: string): string {
  const preview = userMessage.slice(0, 120);
  const lower = userMessage.toLowerCase();
  let angle: string;
  if (/trein|capacita|curso|aprend|habilidade/.test(lower)) {
    angle =
      'Antes de priorizar treinamento, confirme se o gap é de habilidade ou de sistema, contexto ou gestão — o MM Blueprint ancora na causa certa.';
  } else if (/sistema|processo|autom|ferrament|fluxo|bottleneck|gargalo/.test(lower)) {
    angle =
      'Para fricção sistêmica, descreva handoffs, decisões e onde o trabalho se perde; o desenho costuma passar por governança e fluxo, não só conteúdo.';
  } else if (/okr|objetiv|meta|prioridade|trimestre/.test(lower)) {
    angle =
      'Para OKRs ou metas, conecte resultado mensurável a poucas iniciativas com dono e ritmo de revisão — evite lista longa sem decisão.';
  } else if (/equipe|lider|gestão|people|talento|cultura/.test(lower)) {
    angle =
      'Para pessoas e liderança, combine papéis claros, feedback e ambiente psicológico; sem isso, mudanças técnicas raramente sustentam.';
  } else if (/roadmap|blueprint|design|onda\s*2/.test(lower)) {
    angle =
      'No Design (Onda 2), use o diagnóstico 1.1–1.5 como fonte primária e deixe explícito o que não fazer agora, além do que avançar.';
  } else {
    angle =
      'Consolide o diagnóstico em decisões SE-ENTÃO e um recorte 30–90 dias; poucas frentes paralelas costumam vencer dispersão.';
  }
  return (
    `[Modo demonstração — o servidor não tem OPENROUTER_API_KEY; configure a chave para respostas reais do modelo.]\n\n` +
    `Sobre a sua pergunta: "${preview}${userMessage.length > 120 ? '...' : ''}"\n\n` +
    (context?.trim()
      ? `Há trechos de frameworks no contexto (~${context.length} caracteres) que orientariam uma resposta completa.\n\n`
      : '') +
    angle
  );
}
