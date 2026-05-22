import { AgentSettings, AgentSkill } from '../types';
import {
  COLLECTIONS,
  create,
  getById,
  listByUser,
  remove,
  update,
} from './storage';
import { generateId, nowIso } from '../utils/id';

const SKILL_SLUG_REGEX = /(?:^|\s)\/([a-z0-9][a-z0-9_-]*)\b/gi;

export function settingsDocId(userId: string): string {
  return `settings_${userId}`;
}

export function normalizeSlug(input: string): string {
  return String(input)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function getAgentSettings(userId: string): Promise<AgentSettings> {
  const existing = await getById<AgentSettings>(
    COLLECTIONS.agentSettings,
    settingsDocId(userId)
  );

  if (existing) return existing;

  return {
    id: settingsDocId(userId),
    userId,
    enabled: false,
    personaOverride: '',
    rules: '',
    tone: '',
    responseFormat: '',
    forbidden: '',
    preferredModel: '',
    updatedAt: nowIso(),
  };
}

export async function saveAgentSettings(
  userId: string,
  patch: Partial<AgentSettings>
): Promise<AgentSettings> {
  const id = settingsDocId(userId);
  const existing = await getById<AgentSettings>(COLLECTIONS.agentSettings, id);

  const next: AgentSettings = {
    id,
    userId,
    enabled: patch.enabled ?? existing?.enabled ?? false,
    personaOverride: patch.personaOverride ?? existing?.personaOverride ?? '',
    rules: patch.rules ?? existing?.rules ?? '',
    tone: patch.tone ?? existing?.tone ?? '',
    responseFormat: patch.responseFormat ?? existing?.responseFormat ?? '',
    forbidden: patch.forbidden ?? existing?.forbidden ?? '',
    preferredModel: patch.preferredModel ?? existing?.preferredModel ?? '',
    updatedAt: nowIso(),
  };

  if (!existing) {
    await create(COLLECTIONS.agentSettings, id, next as unknown as Record<string, unknown>);
    return next;
  }

  const updated = await update<AgentSettings>(COLLECTIONS.agentSettings, id, next);
  return updated ?? next;
}

export async function listAgentSkills(userId: string): Promise<AgentSkill[]> {
  return listByUser<AgentSkill>(COLLECTIONS.agentSkills, userId);
}

export async function getAgentSkillById(id: string): Promise<AgentSkill | null> {
  return getById<AgentSkill>(COLLECTIONS.agentSkills, id);
}

export async function createAgentSkill(
  userId: string,
  data: {
    slug: string;
    title: string;
    description?: string;
    content: string;
    tags?: string[];
    enabled?: boolean;
  }
): Promise<AgentSkill> {
  const id = generateId();
  const skill: AgentSkill = {
    id,
    userId,
    slug: normalizeSlug(data.slug || data.title),
    title: data.title.trim(),
    description: data.description?.trim() || '',
    content: data.content.trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    enabled: data.enabled !== false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await create(COLLECTIONS.agentSkills, id, skill as unknown as Record<string, unknown>);
  return skill;
}

export async function updateAgentSkill(
  id: string,
  patch: Partial<AgentSkill>
): Promise<AgentSkill | null> {
  const next: Partial<AgentSkill> = { ...patch };
  if (patch.slug !== undefined) next.slug = normalizeSlug(patch.slug);
  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.description !== undefined) next.description = patch.description.trim();
  if (patch.content !== undefined) next.content = patch.content.trim();
  next.updatedAt = nowIso();

  return update<AgentSkill>(COLLECTIONS.agentSkills, id, next);
}

export async function removeAgentSkill(id: string): Promise<boolean> {
  return remove(COLLECTIONS.agentSkills, id);
}

/**
 * Detecta menções a skills no formato `/slug` dentro da mensagem.
 * Retorna a lista (única, na ordem de menção) de slugs encontrados.
 */
export function extractSkillMentions(message: string): string[] {
  const matches = String(message ?? '').matchAll(SKILL_SLUG_REGEX);
  const slugs: string[] = [];
  for (const m of matches) {
    const slug = (m[1] ?? '').toLowerCase();
    if (slug && !slugs.includes(slug)) slugs.push(slug);
  }
  return slugs;
}

/**
 * Resolve skills mencionadas para os objetos completos, respeitando
 * "enabled" e filtrando por userId. Mantém a ordem de menção.
 */
export async function resolveMentionedSkills(
  userId: string,
  message: string
): Promise<AgentSkill[]> {
  const slugs = extractSkillMentions(message);
  if (slugs.length === 0) return [];

  const all = await listAgentSkills(userId);
  const bySlug = new Map(all.filter((s) => s.enabled).map((s) => [s.slug, s]));

  const result: AgentSkill[] = [];
  for (const slug of slugs) {
    const skill = bySlug.get(slug);
    if (skill) result.push(skill);
  }
  return result;
}

/**
 * Monta o trecho a ser adicionado ao SYSTEM_PROMPT considerando
 * settings ativas + skills invocadas via /slug.
 */
export function buildAgentContext(
  settings: AgentSettings,
  invokedSkills: AgentSkill[]
): string {
  const parts: string[] = [];

  if (settings.enabled) {
    if (settings.personaOverride?.trim()) {
      parts.push(`## Persona customizada (sobrescreve a padrão)\n${settings.personaOverride.trim()}`);
    }
    if (settings.rules?.trim()) {
      parts.push(`## Regras obrigatórias\n${settings.rules.trim()}`);
    }
    if (settings.tone?.trim()) {
      parts.push(`## Tom e voz\n${settings.tone.trim()}`);
    }
    if (settings.responseFormat?.trim()) {
      parts.push(`## Formato de resposta esperado\n${settings.responseFormat.trim()}`);
    }
    if (settings.forbidden?.trim()) {
      parts.push(`## Comportamentos proibidos\n${settings.forbidden.trim()}`);
    }
  }

  if (invokedSkills.length > 0) {
    parts.push(
      `## Skills ativadas pelo usuário nesta mensagem\nO usuário invocou as skills a seguir via comando /slug. Você DEVE incorporar as instruções de cada skill, na ordem listada, respeitando regras anteriores.`
    );
    for (const skill of invokedSkills) {
      const desc = skill.description ? `_${skill.description}_\n\n` : '';
      parts.push(`### /${skill.slug} — ${skill.title}\n${desc}${skill.content}`);
    }
  }

  return parts.length > 0 ? `\n\n${parts.join('\n\n')}` : '';
}
