import app from './app';
import { env } from './config/env';

const port = env.port;

app.listen(port, () => {
  console.log(`[magnusmind] Server listening on http://localhost:${port}`);
  console.log(`[magnusmind] Environment: ${env.nodeEnv}`);
});
