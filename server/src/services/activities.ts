import { Activity } from '../types';
import { generateId, nowIso } from '../utils/id';
import { create, listByUser, COLLECTIONS } from './storage';

export async function logActivity(
  userId: string,
  tipo: string,
  descricao: string,
  extra?: Partial<Pick<Activity, 'entidade' | 'entidadeId' | 'metadata'>>
): Promise<Activity> {
  const id = generateId();
  const activity: Activity = {
    id,
    userId,
    tipo,
    descricao,
    entidade: extra?.entidade,
    entidadeId: extra?.entidadeId,
    metadata: extra?.metadata,
    createdAt: nowIso(),
  };
  await create(COLLECTIONS.activities, id, activity as unknown as Record<string, unknown>);
  return activity;
}

export async function getActivities(userId: string): Promise<Activity[]> {
  return listByUser<Activity>(COLLECTIONS.activities, userId);
}
