'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, ApiError } from '@/lib/api';
import { OrkestraMark } from '@/components/Sidebar';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('producer@demo.studio');
  const [password, setPassword] = useState('OrkestraDemo123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      setAccessToken(res.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'Incorrect email or password.'
          : err instanceof ApiError && err.status === 0
            ? "Can't reach the API server — is the backend running?"
            : (err as Error).message;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('producer@demo.studio');
    setPassword('OrkestraDemo123!');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-subtle">
            <OrkestraMark size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Orkestra</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enterprise Autonomous Workforce & Governance
            </p>
          </div>
        </div>

        {/* Login form card */}
        <form onSubmit={handleSubmit} className="card-enterprise p-6 space-y-4 shadow-card">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-foreground">Sign In to Studio Workspace</h2>
            <p className="text-[11px] text-muted-foreground">
              Authenticate to orchestrate AI agent pipelines.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-sm text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-enterprise pl-8"
                  placeholder="name@studio.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-[11px] text-accent hover:underline cursor-pointer"
                >
                  Quick Fill Demo
                </button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-enterprise pl-8"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-2.5 text-xs font-semibold"
          >
            <span>{loading ? 'Authenticating…' : 'Sign in to Workspace'}</span>
            <ArrowRight size={14} />
          </button>

          <div className="pt-3 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground">
              Demo credentials: <code className="font-mono text-foreground">producer@demo.studio</code>
            </p>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-muted-foreground">
          <span>Protected by enterprise RBAC and deterministic policy gates.</span>
        </div>
      </div>
    </div>
  );
}
