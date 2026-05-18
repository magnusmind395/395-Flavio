import { Router, Request, Response, NextFunction } from 'express';
import {
  isWhatsAppConfigured,
  sendWhatsAppMessage,
  verifyWebhook,
  parseIncomingMessage,
} from '../services/whatsapp';
import { AppError } from '../utils/errors';

const router = Router();
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? 'magnusmind-verify';

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: isWhatsAppConfigured(),
    phoneId: process.env.WHATSAPP_PHONE_ID ? '***set***' : null,
  });
});

/** Meta webhook verification */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  const result = verifyWebhook(mode, token, challenge, WEBHOOK_VERIFY_TOKEN);
  if (result) {
    res.status(200).send(result);
    return;
  }
  res.status(403).send('Forbidden');
});

/** Incoming messages (stub — log and acknowledge) */
router.post('/webhook', (req: Request, res: Response) => {
  const incoming = parseIncomingMessage(req.body);
  if (incoming) {
    console.log('[whatsapp] incoming:', incoming.from, incoming.text?.slice(0, 80));
  }
  res.status(200).json({ success: true });
});

router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      throw new AppError(400, 'to and message are required');
    }

    const result = await sendWhatsAppMessage(String(to), String(message));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
