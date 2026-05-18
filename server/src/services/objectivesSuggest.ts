import { SuggestedObjective } from '../types';
import { chatCompletion, mockChatReply } from './openrouter';
import { env } from '../config/env';
import { retrieveRelevantContext } from './rag';
import { listByUser, COLLECTIONS } from './storage';
import { Objective } from '../types';

const DEFAULT_SUGGESTIONS: SuggestedObjective[] = [
  {
    titulo: 'Aumentar receita recorrente em 20%',
    descricao: 'Focar em upsell e retenção de clientes enterprise no próximo trimestre.',
    categoria: 'Financeiro',
    prioridade: 1,
  },
  {
    titulo: 'Reduzir tempo de onboarding em 30%',
    descricao: 'Automatizar fluxos e criar playbooks para novos clientes.',
    categoria: 'Operações',
    prioridade: 2,
  },
  {
    titulo: 'Implementar cultura de feedback contínuo',
    descricao: '1:1s quinzenais e retrospectivas mensais por squad.',
    categoria: 'Pessoas',
    prioridade: 3,
  },
];

export async function suggestObjectives(
  userId: string,
  context?: string
): Promise<SuggestedObjective[]> {
  const existing = await listByUser<Objective>(COLLECTIONS.objectives, userId);
  const ragContext = await retrieveRelevantContext(
    userId,
    context ?? 'objetivos estratégicos planejamento'
  );

  const prompt = `Sugira 3 a 5 objetivos estratégicos novos para uma empresa.
${context ? `Contexto do usuário: ${context}` : ''}
Objetivos existentes (evite duplicar): ${existing.map((o) => o.titulo).join(', ') || 'nenhum'}

Frameworks:
${ragContext}

Responda APENAS com JSON array válido:
[{"titulo":"...","descricao":"...","categoria":"...","prioridade":1}]`;

  try {
    const raw = await chatCompletion({
      model: env.openrouter.defaultModel,
      messages: [
        { role: 'system', content: 'Retorne somente JSON array, sem markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    });

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SuggestedObjective[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5);
      }
    }
  } catch (err) {
    const e = err as { code?: string };
    if (e.code !== 'OPENROUTER_NOT_CONFIGURED') {
      console.warn('[suggest] AI failed:', err);
    }
    mockChatReply(context ?? 'sugestões');
  }

  return DEFAULT_SUGGESTIONS;
}
