import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import {
  createAgentSkill,
  getAgentSettings,
  getAgentSkillById,
  listAgentSkills,
  removeAgentSkill,
  saveAgentSettings,
  updateAgentSkill,
} from '../services/agentConfig';

const router = Router();

router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getAgentSettings(req.userId);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allowed = [
      'enabled',
      'personaOverride',
      'rules',
      'tone',
      'responseFormat',
      'forbidden',
      'preferredModel',
    ] as const;

    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    const updated = await saveAgentSettings(req.userId, patch);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await listAgentSkills(req.userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, title, description, content, tags, enabled } = req.body;

    if (!title || typeof title !== 'string') {
      throw new AppError(400, 'title is required');
    }
    if (!content || typeof content !== 'string') {
      throw new AppError(400, 'content is required');
    }

    const skill = await createAgentSkill(req.userId, {
      slug: String(slug || title),
      title: String(title),
      description: description ? String(description) : undefined,
      content: String(content),
      tags: Array.isArray(tags) ? tags.map(String) : undefined,
      enabled: enabled !== false,
    });

    res.status(201).json(skill);
  } catch (err) {
    next(err);
  }
});

router.patch('/skills/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await getAgentSkillById(id);
    if (!existing || existing.userId !== req.userId) {
      throw new AppError(404, 'Skill not found');
    }

    const allowed = ['slug', 'title', 'description', 'content', 'tags', 'enabled'] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    const updated = await updateAgentSkill(id, patch);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/skills/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await getAgentSkillById(id);
    if (!existing || existing.userId !== req.userId) {
      throw new AppError(404, 'Skill not found');
    }

    await removeAgentSkill(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
