import type { NextFunction, Request, Response } from 'express';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { recordSecurityEvent } from '../lib/security.ts';

export type PlatformRole =
  | 'customer'
  | 'supplier'
  | 'operations'
  | 'content_manager'
  | 'finance'
  | 'admin'
  | 'super_admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: PlatformRole[];
  aal: string | null;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

function decodeJwtPayloadAal(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(payloadJson) as { aal?: string };
    return typeof parsed.aal === 'string' ? parsed.aal : null;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication token missing' });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      void recordSecurityEvent({
        severity: 'medium',
        eventCode: 'INVALID_BEARER_TOKEN',
        summary: 'Rejected invalid or expired authentication token',
        ipAddress: req.ip || null,
        metadata: { path: req.path },
      });
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    const user = data.user;
    const email = user.email || '';
    const fullName =
      (user.user_metadata?.full_name as string | undefined) || email.split('@')[0] || '';

    // Ensure profile row exists
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
      },
      { onConflict: 'id', ignoreDuplicates: false },
    );

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', user.id);

    const extractedRoles = new Set<PlatformRole>();
    if (Array.isArray(roleRows)) {
      for (const row of roleRows) {
        const joined = row.roles as { code?: PlatformRole } | null;
        if (joined?.code) {
          extractedRoles.add(joined.code);
        }
      }
    }

    // Assign default customer role if user has no role rows yet
    if (extractedRoles.size === 0) {
      const { data: custRole } = await supabase
        .from('roles')
        .select('id')
        .eq('code', 'customer')
        .maybeSingle();
      if (custRole?.id) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: user.id, role_id: custRole.id }, { onConflict: 'user_id,role_id' });
      }
      extractedRoles.add('customer');
    }

    req.authUser = {
      id: user.id,
      email,
      fullName,
      roles: Array.from(extractedRoles),
      aal: decodeJwtPayloadAal(token),
    };

    next();
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({
        error: err.message,
        missingVars: err.missingVars,
      });
      return;
    }
    console.error('Auth verification error:', err);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
}

export function requireRoles(allowedRoles: PlatformRole[], options?: { requireMfa?: boolean }) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authUser = req.authUser;
    if (!authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const authorized = authUser.roles.some((role) => allowedRoles.includes(role));
    if (!authorized) {
      void recordSecurityEvent({
        userId: authUser.id,
        severity: 'high',
        eventCode: 'UNAUTHORIZED_ROLE_ACCESS',
        summary: `Blocked role escalation attempt on ${req.method} ${req.path}`,
        ipAddress: req.ip || null,
        metadata: { required: allowedRoles, held: authUser.roles },
      });
      res.status(403).json({ error: 'Insufficient permissions for this operation' });
      return;
    }

    if (options?.requireMfa) {
      const supabase = requireSupabaseAdmin();
      const { data: profile } = await supabase
        .from('profiles')
        .select('mfa_enforced')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile?.mfa_enforced && authUser.aal !== 'aal2') {
        void recordSecurityEvent({
          userId: authUser.id,
          severity: 'high',
          eventCode: 'MFA_STEP_UP_REQUIRED',
          summary: `Blocked privileged action without AAL2 MFA verification on ${req.path}`,
          ipAddress: req.ip || null,
        });
        res.status(403).json({
          error: 'Multi-factor authentication verification (AAL2) is required for this privileged action.',
          code: 'MFA_REQUIRED',
        });
        return;
      }
    }

    next();
  };
}
