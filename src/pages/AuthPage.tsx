import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthPage() {
  const { configured, session, userContext, refreshUserContext, signOut } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountIntent, setAccountIntent] = useState<'customer' | 'supplier'>('customer');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // TOTP MFA state
  const [totpQrUri, setTotpQrUri] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({
        type: 'err',
        text: 'Authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be configured.',
      });
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshUserContext();
        setMessage({ type: 'ok', text: 'Signed in securely.' });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              intended_role: accountIntent,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        setMessage({
          type: 'ok',
          text: 'Account created. Check your inbox to verify your email address before signing in.',
        });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setMessage({
          type: 'ok',
          text: 'Password reset instructions sent if an account exists for that email.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Authentication request failed.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleEnrollTotp() {
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Transend Tours Authenticator',
      });
      if (error) throw error;
      setTotpFactorId(data.id);
      setTotpQrUri(data.totp.uri);
      setMessage({
        type: 'ok',
        text: 'Scan or enter the authenticator URI below, then verify a 6-digit code to elevate to AAL2.',
      });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to start MFA enrollment.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyTotp(e: FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    try {
      let targetFactorId = totpFactorId;
      if (!targetFactorId) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        targetFactorId = factors?.totp?.[0]?.id ?? null;
      }
      if (!targetFactorId) {
        throw new Error('No TOTP MFA factor enrolled on this account yet.');
      }

      const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({
        factorId: targetFactorId,
      });
      if (chalErr) throw chalErr;

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: targetFactorId,
        challengeId: challenge.id,
        code: totpCode.trim(),
      });
      if (verErr) throw verErr;

      await refreshUserContext();
      setTotpQrUri(null);
      setTotpCode('');
      setMessage({ type: 'ok', text: 'AAL2 multi-factor verification active for this session.' });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Invalid TOTP verification code.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-32 pb-24 bg-[#F6F4ED] min-h-screen">
      <div className="mx-auto max-w-[1100px] px-6 sm:px-10 space-y-10">
        <EditorialSectionHeader
          eyebrow="Transend Tours · Account & Access"
          title="Marketplace Authentication & Security"
          subtitle="Sign in to book verified Transend Tours itineraries, onboard as an approved tourism supplier, or access finance and operations portals."
        />

        {!configured && (
          <div className="bg-[#FFFFFF] border border-[#D9C397] p-6 text-sm text-[#102D25] space-y-2">
            <p className="font-semibold uppercase tracking-[0.14em] text-xs text-[#244B3A]">
              Environment Configuration Notice
            </p>
            <p className="text-[#788078] leading-relaxed">
              Supabase client authentication environment variables (<code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>) are not configured in this workspace yet. Add them to enable live sign-in, email verification, and MFA step-up.
            </p>
          </div>
        )}

        {message && (
          <div
            role="status"
            className={`p-4 border text-sm ${
              message.type === 'ok'
                ? 'bg-[#FFFFFF] border-[#244B3A] text-[#102D25]'
                : 'bg-[#FFFFFF] border-red-700 text-red-900'
            }`}
          >
            {message.text}
          </div>
        )}

        {session ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#E7E4DA] pb-5">
                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                    Verified Session
                  </span>
                  <h2 className="font-serif text-2xl text-[#102D25] mt-1">
                    {userContext?.user.fullName || session.user.email}
                  </h2>
                  <p className="text-xs text-[#788078] mt-1">{session.user.email}</p>
                </div>
                <UserCheck className="w-6 h-6 text-[#244B3A]" aria-hidden="true" />
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-[#F6F4ED] border border-[#E7E4DA]">
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">Assigned Roles</dt>
                  <dd className="mt-1 font-medium text-[#102D25]">
                    {userContext?.user.roles.join(', ') || 'customer'}
                  </dd>
                </div>
                <div className="p-4 bg-[#F6F4ED] border border-[#E7E4DA]">
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">
                    Authenticator Assurance
                  </dt>
                  <dd className="mt-1 font-medium text-[#102D25]">
                    {userContext?.user.aal || 'aal1'}
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <GlassButton to="/portal/customer" variant="forest">
                  <span>Traveller Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
                <GlassButton to="/portal/supplier" variant="ivory">
                  <span>Supplier Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
                <GlassButton to="/checkout" variant="ivory">
                  <span>Live Split Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
                <GlassButton to="/portal/admin" variant="ivory">
                  <span>Admin &amp; Finance Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              </div>

              <div className="pt-4 border-t border-[#E7E4DA]">
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-xs uppercase tracking-[0.16em] font-semibold text-red-800 hover:underline cursor-pointer"
                >
                  Sign Out of Session
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-5">
              <div className="flex items-center gap-2.5 text-[#102D25]">
                <ShieldCheck className="w-5 h-5 text-[#244B3A]" />
                <h3 className="font-serif text-xl">TOTP Multi-Factor Step-Up</h3>
              </div>
              <p className="text-xs text-[#788078] leading-relaxed">
                Finance, operations, and administrative actions (supplier approvals, commission edits, refunds, reconciliation) require AAL2 verification when MFA is enforced.
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleEnrollTotp()}
                className="w-full px-4 py-3 border border-[#102D25] text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:bg-[#102D25] hover:text-[#F6F4ED] transition-colors cursor-pointer"
              >
                Enroll New Authenticator (TOTP)
              </button>

              {totpQrUri && (
                <div className="p-3 bg-[#F6F4ED] border border-[#E7E4DA] text-[11px] break-all">
                  <span className="block font-semibold text-[#102D25] mb-1">
                    Authenticator URI (import into Google Authenticator / 1Password):
                  </span>
                  {totpQrUri}
                </div>
              )}

              <form onSubmit={handleVerifyTotp} className="space-y-3 pt-2 border-t border-[#E7E4DA]">
                <label className="block text-xs uppercase tracking-[0.14em] text-[#788078]">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-4 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold hover:bg-[#18392F] transition-colors cursor-pointer"
                >
                  Verify &amp; Elevate to AAL2
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E7E4DA] p-8 sm:p-10 space-y-6">
              <div className="flex flex-wrap gap-2 border-b border-[#E7E4DA] pb-4">
                {(
                  [
                    { id: 'signin', label: 'Sign In' },
                    { id: 'signup', label: 'Create Account' },
                    { id: 'reset', label: 'Reset Password' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id);
                      setMessage(null);
                    }}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.16em] font-semibold cursor-pointer border ${
                      mode === tab.id
                        ? 'bg-[#102D25] text-[#F6F4ED] border-[#102D25]'
                        : 'bg-[#F6F4ED] text-[#26342D] border-[#E7E4DA]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tendai Moyo"
                        className="w-full px-4 py-3 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2">
                        Portal Intention
                      </label>
                      <select
                        value={accountIntent}
                        onChange={(e) => setAccountIntent(e.target.value as 'customer' | 'supplier')}
                        className="w-full px-4 py-3 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                      >
                        <option value="customer">Traveller — Book Experiences &amp; Stays</option>
                        <option value="supplier">Tourism Supplier — Apply for Verification</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-4 py-3 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !configured}
                  className="w-full px-6 py-4 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#18392F] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {busy
                    ? 'Processing...'
                    : mode === 'signin'
                      ? 'Sign In'
                      : mode === 'signup'
                        ? 'Register Account'
                        : 'Send Reset Link'}
                </button>
              </form>
            </div>

            <aside className="lg:col-span-5 bg-[#102D25] text-[#F6F4ED] p-8 sm:p-10 space-y-5">
              <KeyRound className="w-6 h-6 text-[#D9C397]" />
              <h2 className="font-serif text-2xl">Role-Based Marketplace Governance</h2>
              <ul className="space-y-3 text-sm text-[#F6F4ED]/80 leading-relaxed">
                <li>• Sessions are stored strictly in memory without browser localStorage tokens.</li>
                <li>• Every API route verifies Supabase JWT claims and server-side RBAC roles.</li>
                <li>• Suppliers begin unapproved and cannot receive live split payments until KYC &amp; Pesepay beneficiary review is approved.</li>
              </ul>
              <div className="pt-4 border-t border-[#FFFFFF]/15">
                <Link
                  to="/checkout"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#D9C397] hover:underline"
                >
                  <span>Browse Live Marketplace Slots</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
