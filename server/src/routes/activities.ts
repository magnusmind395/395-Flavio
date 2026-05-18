import { Router, Request, Response, NextFunction } from 'express';
import { getActivities } from '../services/activities';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await getActivities(req.userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
