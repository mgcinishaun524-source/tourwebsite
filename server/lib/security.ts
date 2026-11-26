import type { NextFunction, Request, Response } from 'express';
import { getServerConfig } from './config.ts';
import { getSupabaseAdmin } from './supabase.ts';

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

export function strictCorsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.headers.origin;
  const cfg = getServerConfig();
  const hostOrigin = req.headers.host ? `https://${req.headers.host}` : '';
  const localOrigin = req.headers.host ? `http://${req.headers.host}` : '';

  const allowedOrigins = new Set(
    [cfg.appUrl, hostOrigin, localOrigin, 'http://localhost:3000'].filter(Boolean),
  );

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Idempotency-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
      return;
    }
    res.status(204).end();
    return;
  }

  next();
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const existing = rateBuckets.get(key);

    if (!existing || existing.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      void recordSecurityEvent({
        severity: 'medium',
        eventCode: 'RATE_LIMIT_EXCEEDED',
        summary: `Rate limit exceeded on ${options.keyPrefix}`,
        ipAddress: ip,
        metadata: { path: req.path, method: req.method },
      });
      res.status(429).json({
        error: 'Too many requests. Please pause briefly and try again.',
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

export function sanitizePlainText(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function recordSecurityEvent(input: {
  userId?: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  eventCode: string;
  summary: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'SECURITY_EVENT',
    severity: input.severity,
    eventCode: input.eventCode,
    summary: input.summary,
    userId: input.userId ?? null,
  };
  if (input.severity === 'high' || input.severity === 'critical') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.warn(JSON.stringify(logEntry));
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('security_events').insert({
      user_id: input.userId ?? null,
      severity: input.severity,
      event_code: input.eventCode,
      summary: input.summary,
      ip_address: input.ipAddress ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Non-fatal logging fallback to prevent cascading failures
  }
}

export async function recordAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('audit_logs').insert({
      actor_user_id: input.actorUserId ?? null,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      before_state: input.beforeState ?? null,
      after_state: input.afterState ?? null,
      ip_address: input.ipAddress ?? null,
    });
  } catch {
    // Non-fatal logging fallback
  }
}
