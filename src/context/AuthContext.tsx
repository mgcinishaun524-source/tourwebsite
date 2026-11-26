import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { apiFetch } from '../lib/apiClient';
import {
  getSupabaseBrowserClient,
  isClientSupabaseConfigured,
} from '../lib/supabaseClient';

export type PlatformRole =
  | 'customer'
  | 'supplier'
  | 'operations'
  | 'content_manager'
  | 'finance'
  | 'admin'
  | 'super_admin';

export interface ServerUserContext {
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: PlatformRole[];
    aal: string | null;
  };
  supplier: {
    id: string;
    trading_name: string;
    legal_name: string;
    verification_status: string;
    can_accept_paid_bookings: boolean;
  } | null;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  userContext: ServerUserContext | null;
  accessToken: string | null;
  refreshUserContext: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isClientSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [userContext, setUserContext] = useState<ServerUserContext | null>(null);

  const hydrateServerContext = useCallback(async (token: string | null) => {
    if (!token) {
      setUserContext(null);
      return;
    }
    try {
      const data = await apiFetch<ServerUserContext>('/api/auth/me', {
        accessToken: token,
      });
      setUserContext(data);
    } catch {
      setUserContext(null);
    }
  }, []);

  const refreshUserContext = useCallback(async () => {
    await hydrateServerContext(session?.access_token ?? null);
  }, [hydrateServerContext, session?.access_token]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      await hydrateServerContext(data.session?.access_token ?? null);
      if (mounted) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void hydrateServerContext(nextSession?.access_token ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrateServerContext]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUserContext(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        session,
        userContext,
        accessToken: session?.access_token ?? null,
        refreshUserContext,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
