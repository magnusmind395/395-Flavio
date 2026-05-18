import axios from 'axios';
import { env } from '../config/env';

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

/** Detect if user message likely needs web search */
export function shouldSearchWeb(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = [
    'pesquis',
    'search',
    'buscar',
    'notícia',
    'atual',
    'mercado',
    'concorrent',
    'tendência',
    'web',
    'internet',
    'hoje',
    '2024',
    '2025',
    '2026',
  ];
  return triggers.some((t) => lower.includes(t));
}

export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  if (env.serperApiKey) {
    return serperSearch(query, limit);
  }
  if (env.tavilyApiKey) {
    return tavilySearch(query, limit);
  }
  return [];
}

async function serperSearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await axios.post(
    'https://google.serper.dev/search',
    { q: query, num: limit },
    {
      headers: { 'X-API-KEY': env.serperApiKey!, 'Content-Type': 'application/json' },
      timeout: env.axiosTimeout,
    }
  );

  const organic = res.data?.organic ?? [];
  return organic.slice(0, limit).map((r: { title?: string; snippet?: string; link?: string }) => ({
    title: r.title ?? '',
    snippet: r.snippet ?? '',
    link: r.link ?? '',
  }));
}

async function tavilySearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await axios.post(
    'https://api.tavily.com/search',
    {
      api_key: env.tavilyApiKey,
      query,
      max_results: limit,
    },
    { timeout: env.axiosTimeout }
  );

  const results = res.data?.results ?? [];
  return results.slice(0, limit).map((r: { title?: string; content?: string; url?: string }) => ({
    title: r.title ?? '',
    snippet: r.content ?? '',
    link: r.url ?? '',
  }));
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';
  return (
    '## Resultados da pesquisa web\n\n' +
    results
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.link}`)
      .join('\n\n')
  );
}

export function isSearchConfigured(): boolean {
  return Boolean(env.serperApiKey || env.tavilyApiKey);
}
