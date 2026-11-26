import express from 'express';
import {
  createRateLimiter,
  securityHeadersMiddleware,
  strictCorsMiddleware,
} from './lib/security.ts';
import { adminRouter } from './routes/admin.ts';
import { bookingsRouter } from './routes/bookings.ts';
import { paymentsRouter } from './routes/payments.ts';
import { publicRouter } from './routes/public.ts';
import { refundsRouter } from './routes/refunds.ts';
import { suppliersRouter } from './routes/suppliers.ts';

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeadersMiddleware);
  app.use(strictCorsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  const generalApiLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 120,
    keyPrefix: 'api-general',
  });

  const sensitiveActionLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
    keyPrefix: 'api-sensitive',
  });

  app.use('/api', generalApiLimiter);
  app.use('/api/payments', sensitiveActionLimiter);
  app.use('/api/bookings/reserve', sensitiveActionLimiter);
  app.use('/api/refunds', sensitiveActionLimiter);

  app.use('/api', publicRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/refunds', refundsRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}
