import dotenv from 'dotenv';
import cron from 'node-cron';
import { syncWhoIcdData } from './services/whoIcdService.js';
import { logger } from './utils/logger.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3002;

// Optional cron only in non-serverless environment
if (process.env.VERCEL !== '1') {
  cron.schedule('0 2 * * *', () => {
    logger.info('Scheduled WHO ICD-11 sync (local/server)');
    syncWhoIcdData().catch(err => logger.error('WHO ICD sync failed:', err));
  });
}

app.listen(PORT, () => {
  logger.info(`MediSync Terminology Service listening on port ${PORT}`);
});

export default app;